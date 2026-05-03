import { Module } from '@nestjs/common';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SubscriptionLifecycleService],
  exports: [SubscriptionLifecycleService],
})
export class SubscriptionsModule {}
