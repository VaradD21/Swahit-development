import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface UserEntitlements {
  plan: string;
  features: Record<string, { enabled: boolean; limit: number | null; used: number; remaining: number | null }>;
}

@Injectable()
export class EntitlementResolverService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async resolveUserEntitlements(userId: string): Promise<UserEntitlements> {
    const cacheKey = `entitlements:${userId}`;
    const cached = await this.cacheManager.get<UserEntitlements>(cacheKey);
    if (cached) return cached;

    // 1. Fetch active UserSubscription -> Plan -> PlanFeature -> Feature
    const subscription = await this.prisma.userSubscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        plan: {
          include: {
            features: {
              include: { feature: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const planName = subscription?.plan?.name || 'FREE';
    
    // If no active subscription found, fallback to FREE plan features
    let featuresData = subscription?.plan?.features;
    if (!featuresData) {
      const freePlan = await this.prisma.plan.findUnique({
        where: { name: 'FREE' },
        include: { features: { include: { feature: true } } },
      });
      featuresData = freePlan?.features || [];
    }

    // 2. Fetch FeatureUsage
    const usages = await this.prisma.featureUsage.findMany({
      where: { userId },
    });
    const usageMap = new Map(usages.map(u => [u.featureKey, u.usageCount]));

    // 3. Merge into single entitlement object
    const features: UserEntitlements['features'] = {};
    for (const pf of featuresData) {
      const key = pf.feature.key;
      const limit = pf.limitValue;
      const used = usageMap.get(key) || 0;
      const remaining = limit === null ? null : Math.max(0, limit - used);

      features[key] = {
        enabled: pf.isEnabled && (limit === null || used < limit),
        limit,
        used,
        remaining,
      };
    }

    const result: UserEntitlements = { plan: planName, features };
    
    // Cache with 60s TTL
    await this.cacheManager.set(cacheKey, result, 60000);

    return result;
  }

  async checkFeatureAccess(userId: string, featureKey: string) {
    const entitlements = await this.resolveUserEntitlements(userId);
    const featureAccess = entitlements.features[featureKey];

    if (!featureAccess) {
      return { allowed: false, reason: 'NOT_ENABLED', requiredPlan: 'UPGRADE_REQUIRED' };
    }

    if (!featureAccess.enabled && featureAccess.limit !== null && featureAccess.used >= featureAccess.limit) {
      return { allowed: false, reason: 'LIMIT_REACHED', requiredPlan: 'UPGRADE_REQUIRED' };
    }

    return { allowed: featureAccess.enabled, reason: null, requiredPlan: null };
  }

  async consumeFeature(userId: string, featureKey: string) {
    const access = await this.checkFeatureAccess(userId, featureKey);
    if (!access.allowed) {
      throw {
        code: 'FEATURE_LOCKED',
        feature: featureKey,
        requiredPlan: access.requiredPlan || 'UPGRADE_REQUIRED',
        reason: access.reason,
      };
    }

    // Upsert FeatureUsage
    const now = new Date();
    // Default reset logic: next day midnight
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    await this.prisma.featureUsage.upsert({
      where: { userId_featureKey: { userId, featureKey } },
      update: { usageCount: { increment: 1 } },
      create: {
        userId,
        featureKey,
        usageCount: 1,
        resetAt: nextMidnight,
      },
    });

    // Invalidate cache
    await this.invalidateCache(userId);
  }

  async invalidateCache(userId: string) {
    await this.cacheManager.del(`entitlements:${userId}`);
  }
}
