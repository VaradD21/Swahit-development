import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly razorpayService: RazorpayService,
  ) {}

  @Post('stripe/checkout')
  async createStripeCheckout(@Req() req: any, @Body() body: { planId: string, priceId: string }) {
    const userId = req.user.id;
    return this.stripeService.createCheckoutSession(userId, body.planId, body.priceId);
  }

  @Post('razorpay/order')
  async createRazorpayOrder(@Req() req: any, @Body() body: { planId: string, amount: number }) {
    return this.razorpayService.createOrder(body.planId, body.amount);
  }
}
