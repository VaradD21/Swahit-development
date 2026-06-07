import { Controller, Post, Body, Headers, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { SubscriptionLifecycleService } from '../subscriptions/subscription-lifecycle.service';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Controller('webhooks/payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly razorpayService: RazorpayService,
    private readonly subscriptionService: SubscriptionLifecycleService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    let event;

    try {
      // Note: NestJS must be configured to preserve raw body for Stripe signature verification
      event = this.stripeService.constructEvent(req.rawBody, signature);
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`);
      throw new HttpException(`Webhook Error: ${err.message}`, HttpStatus.BAD_REQUEST);
    }

    // 1. Log the webhook immediately
    try {
      await this.prisma.webhookLog.create({
        data: {
          provider: 'stripe',
          eventId: event.id,
          eventType: event.type,
          payload: JSON.stringify(event.data.object),
          status: 'PROCESSING',
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        // Unique constraint failed, meaning we already processed this event. Idempotency!
        this.logger.log(`Skipping duplicate Stripe event: ${event.id}`);
        return { received: true };
      }
      this.logger.error('Failed to log webhook', err);
    }

    // 2. Process the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const planId = session.metadata?.planId;
          const subscriptionId = session.subscription;

          if (userId && planId && subscriptionId) {
            await this.subscriptionService.createSubscription(
              userId,
              planId,
              'stripe',
              subscriptionId as string,
            );
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId; // Assuming attached
          const subscriptionId = subscription.id;

          if (userId && subscriptionId) {
            await this.subscriptionService.cancelSubscription(userId, subscriptionId);
          }
          break;
        }
        // ... handle invoice.payment_succeeded etc.
      }

      // Mark as processed
      await this.prisma.webhookLog.update({
        where: { eventId: event.id },
        data: { status: 'PROCESSED' },
      });

    } catch (error) {
      this.logger.error(`Error processing event ${event.id}`, error);
      await this.prisma.webhookLog.update({
        where: { eventId: event.id },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw new HttpException('Webhook processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { received: true };
  }

  @Post('razorpay')
  async handleRazorpayWebhook(@Headers('x-razorpay-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    if (!signature) {
      throw new HttpException('Signature is missing', HttpStatus.BAD_REQUEST);
    }

    const rawBodyStr = req.rawBody ? req.rawBody.toString() : '';
    const isValid = this.razorpayService.verifyWebhookSignature(rawBodyStr, signature);

    if (!isValid) {
      this.logger.error('Invalid Razorpay signature');
      throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
    }

    const body = JSON.parse(rawBodyStr);
    const eventId = body.id;
    const eventType = body.event;

    // 1. Log the webhook immediately
    try {
      await this.prisma.webhookLog.create({
        data: {
          provider: 'razorpay',
          eventId: eventId,
          eventType: eventType,
          payload: JSON.stringify(body.payload),
          status: 'PROCESSING',
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        this.logger.log(`Skipping duplicate Razorpay event: ${eventId}`);
        return { received: true };
      }
      this.logger.error('Failed to log Razorpay webhook', err);
    }

    // 2. Process subscription events
    try {
      switch (eventType) {
        case 'subscription.charged': {
          const subscriptionData = body.payload.subscription.entity;
          const notes = subscriptionData.notes || {};
          const userId = notes.userId;
          const planId = notes.planId;
          const subscriptionId = subscriptionData.id;

          if (userId && planId && subscriptionId) {
            await this.subscriptionService.createSubscription(
              userId,
              planId,
              'razorpay',
              subscriptionId,
            );
          }
          break;
        }
        case 'subscription.cancelled': {
          const subscriptionData = body.payload.subscription.entity;
          const notes = subscriptionData.notes || {};
          const userId = notes.userId;
          const subscriptionId = subscriptionData.id;

          if (userId && subscriptionId) {
            await this.subscriptionService.cancelSubscription(userId, subscriptionId);
          }
          break;
        }
      }

      // Mark as processed
      await this.prisma.webhookLog.update({
        where: { eventId: eventId },
        data: { status: 'PROCESSED' },
      });

    } catch (error) {
      this.logger.error(`Error processing Razorpay event ${eventId}`, error);
      await this.prisma.webhookLog.update({
        where: { eventId: eventId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw new HttpException('Webhook processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { received: true };
  }
}
