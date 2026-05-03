import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_mock',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'secret_mock',
    });
  }

  async createOrder(planId: string, amount: number) {
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
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'secret_mock';
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}
