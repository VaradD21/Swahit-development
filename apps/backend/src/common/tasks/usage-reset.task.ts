import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementResolverService } from '../entitlements/entitlement-resolver.service';

@Injectable()
export class UsageResetTask {
  private readonly logger = new Logger(UsageResetTask.name);

  constructor(
    private prisma: PrismaService,
    private entitlementResolver: EntitlementResolverService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running daily usage reset job...');
    const now = new Date();

    // Find all usages where resetAt has passed
    const toReset = await this.prisma.featureUsage.findMany({
      where: { resetAt: { lte: now } },
    });

    if (toReset.length === 0) {
      this.logger.log('No feature usages to reset.');
      return;
    }

    // Next reset is exactly 24 hours from current midnight
    const nextReset = new Date(now);
    nextReset.setHours(24, 0, 0, 0);

    const updated = await this.prisma.featureUsage.updateMany({
      where: { resetAt: { lte: now } },
      data: { usageCount: 0, resetAt: nextReset },
    });

    this.logger.log(`Reset ${updated.count} feature usage records.`);

    // Invalidate caches for affected users
    const userIds = [...new Set(toReset.map(u => u.userId))];
    for (const userId of userIds) {
      await this.entitlementResolver.invalidateCache(userId);
    }
  }
}
