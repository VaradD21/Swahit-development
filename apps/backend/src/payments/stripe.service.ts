import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_mock';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia', // Updated to valid valid API version
    });
  }

  async createCheckoutSession(userId: string, planId: string, priceId: string) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId, // The Stripe Price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get('FRONTEND_URL')}/dashboard/settings?success=true`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/dashboard/settings?canceled=true`,
        metadata: {
          userId,
          planId,
        },
      });
      return { url: session.url };
    } catch (error) {
      this.logger.error('Failed to create Stripe checkout session', error);
      throw error;
    }
  }

  constructEvent(payload: any, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || 'whsec_mock';
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
