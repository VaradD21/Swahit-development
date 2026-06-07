import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private mockMode = false;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY is missing. Operating in MOCK mode.');
      this.mockMode = true;
      return;
    }
    this.stripe = new Stripe(secretKey, {
      // @ts-ignore - Ignore type error if stripe-node version is slightly outdated compared to desired API version
      apiVersion: '2025-01-27.acacia',
    });
  }

  async createCheckoutSession(userId: string, planId: string, priceId: string) {
    if (this.mockMode) {
      return { url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard/settings?success=true` };
    }
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
    if (this.mockMode) {
      throw new Error('Stripe is bypassed, mock mode active');
    }
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required in environment');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
