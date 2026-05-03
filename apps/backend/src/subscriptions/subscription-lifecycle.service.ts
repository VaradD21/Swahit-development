import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(private prisma: PrismaService) {}

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

    // Cancel old active subscriptions
    await this.prisma.userSubscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', endDate: new Date() },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // Default +30 days

    const newSub = await this.prisma.userSubscription.create({
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

    return newSub;
  }

  async cancelSubscription(userId: string, externalSubscriptionId: string) {
    this.logger.log(`Cancelling subscription ${externalSubscriptionId} for user ${userId}`);
    return this.prisma.userSubscription.updateMany({
      where: { userId, externalSubscriptionId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', endDate: new Date() },
    });
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
    const current = await this.getCurrentSubscription(userId);
    if (current?.planId === newPlanId) {
      throw new HttpException('Already on this plan', HttpStatus.BAD_REQUEST);
    }

    if (current) {
      await this.prisma.userSubscription.update({
        where: { id: current.id },
        data: { status: 'CANCELLED', endDate: new Date() },
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    return this.prisma.userSubscription.create({
      data: {
        userId,
        planId: newPlanId,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });
  }
}
