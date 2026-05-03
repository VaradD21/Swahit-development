import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';

@Controller('medicine')
@UseGuards(JwtAuthGuard)
export class MedicineController {
  constructor(
    private readonly prescriptionService: PrescriptionService,
    private readonly orderService: OrderService,
  ) {}

  @Post('prescriptions')
  @UseGuards(FeatureGuard('prescription_upload')) // Silver+
  async uploadPrescription(@Request() req: any, @Body('fileUrl') fileUrl: string) {
    return this.prescriptionService.uploadPrescription(req.user.userId, fileUrl);
  }

  @Get('prescriptions')
  async getPrescriptions(@Request() req: any) {
    return this.prescriptionService.getUserPrescriptions(req.user.userId);
  }

  @Post('orders')
  @UseGuards(FeatureGuard('medicine_delivery')) // Gold+
  async createOrder(
    @Request() req: any, 
    @Body() body: { prescriptionId: string, items: { name: string, quantity: number, price: number }[] }
  ) {
    return this.orderService.createOrder(req.user.userId, body.prescriptionId, body.items);
  }

  @Get('orders')
  async getOrders(@Request() req: any) {
    return this.orderService.getUserOrders(req.user.userId);
  }
}
