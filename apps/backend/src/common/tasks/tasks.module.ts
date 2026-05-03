import { Module } from '@nestjs/common';
import { UsageResetTask } from './usage-reset.task';
import { SubscriptionExpiryTask } from './subscription-expiry.task';
import { PrismaModule } from '../../prisma/prisma.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  providers: [UsageResetTask, SubscriptionExpiryTask],
})
export class TasksModule {}
