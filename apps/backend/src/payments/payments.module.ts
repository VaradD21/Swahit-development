import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SubscriptionsModule, PrismaModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [StripeService, RazorpayService],
  exports: [StripeService, RazorpayService],
})
export class PaymentsModule {}
