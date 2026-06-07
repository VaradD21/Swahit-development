import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;
  private readonly logger = new Logger(RazorpayService.name);
  private mockMode = false;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn('RAZORPAY credentials missing. Operating in MOCK mode.');
      this.mockMode = true;
      return;
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(planId: string, amount: number) {
    if (this.mockMode) {
      return { id: 'mock_order_id_' + Date.now(), amount: amount * 100, currency: 'INR', receipt: `receipt_${planId}_${Date.now()}` };
    }
    try {
      const order = await this.razorpay.orders.create({
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${planId}_${Date.now()}`,
        notes: { planId },
      });
      return order;
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error);
      throw error;
    }
  }

  verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
    if (this.mockMode) return true;
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) throw new Error('RAZORPAY_KEY_SECRET is required');
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (this.mockMode) return true;
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is required');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signature;
  }
}
