import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementResolverService } from '../common/entitlements/entitlement-resolver.service';

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private entitlementResolver: EntitlementResolverService,
  ) {}

  async createSubscription(
    userId: string,
    planId: string,
    paymentProvider: string,
    externalSubscriptionId: string,
  ) {
    this.logger.log(`Creating new subscription for user ${userId} on plan ${planId}`);

    // Check idempotency: If this externalSubscriptionId already exists, return early
    const existing = await this.prisma.userSubscription.findFirst({
      where: { externalSubscriptionId },
    });
    if (existing) {
      this.logger.log(`Subscription ${externalSubscriptionId} already processed. Skipping.`);
      return existing;
    }

    const newSub = await this.prisma.$transaction(async (tx) => {
      // Cancel old active subscriptions
      await tx.userSubscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED', endDate: new Date() },
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30); // Default +30 days

      return tx.userSubscription.create({
        data: {
          userId,
          planId,
          status: 'ACTIVE',
          startDate,
          endDate,
          paymentProvider,
          externalSubscriptionId,
        },
      });
    });

    // Invalidate entitlements cache
    await this.entitlementResolver.invalidateCache(userId);

    return newSub;
  }

  async cancelSubscription(userId: string, externalSubscriptionId: string) {
    this.logger.log(`Cancelling subscription ${externalSubscriptionId} for user ${userId}`);
    const result = await this.prisma.userSubscription.updateMany({
      where: { userId, externalSubscriptionId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', endDate: new Date() },
    });

    // Invalidate entitlements cache
    await this.entitlementResolver.invalidateCache(userId);

    return result;
  }

  async getCurrentSubscription(userId: string) {
    return this.prisma.userSubscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upgradePlan(userId: string, newPlanId: string) {
    // This method handles immediate DB swaps without a payment gateway hook (if doing manual/admin upgrades)
    const newSub = await this.prisma.$transaction(async (tx) => {
      const current = await tx.userSubscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      if (current?.planId === newPlanId) {
        throw new HttpException('Already on this plan', HttpStatus.BAD_REQUEST);
      }

      if (current) {
        await tx.userSubscription.update({
          where: { id: current.id },
          data: { status: 'CANCELLED', endDate: new Date() },
        });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      return tx.userSubscription.create({
        data: {
          userId,
          planId: newPlanId,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });
    });

    // Invalidate entitlements cache
    await this.entitlementResolver.invalidateCache(userId);

    return newSub;
  }
}
