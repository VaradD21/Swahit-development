import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly razorpayService: RazorpayService,
  ) {}

  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard)
  async createStripeCheckout(@Req() req: any, @Body() body: { planId: string, priceId: string }) {
    const userId = req.user.id;
    return this.stripeService.createCheckoutSession(userId, body.planId, body.priceId);
  }

  @Post('razorpay/order')
  @UseGuards(JwtAuthGuard)
  async createRazorpayOrder(@Req() req: any, @Body() body: { planId: string, amount: number }) {
    return this.razorpayService.createOrder(body.planId, body.amount);
  }

  @Post('webhook/stripe')
  async stripeWebhook(@Req() req: any) {
    const signature = req.headers['stripe-signature'];
    try {
      const event = this.stripeService.constructEvent(req.rawBody, signature);
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        // In a real app, we would update the user's entitlement/subscription status here
        console.log(`[Stripe Webhook] Subscription confirmed for user: ${userId}`);
      }
      return { received: true };
    } catch (err: any) {
      return { error: `Webhook Error: ${err.message}` };
    }
  }
}
