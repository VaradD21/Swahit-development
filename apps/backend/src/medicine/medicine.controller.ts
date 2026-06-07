import { Controller, Post, Get, UseGuards, Request, Body, BadRequestException } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('medicine')
@UseGuards(JwtAuthGuard)
export class MedicineController {
  constructor(
    private readonly prescriptionService: PrescriptionService,
    private readonly orderService: OrderService,
  ) {}

  @Post('prescriptions')
  @UseGuards(FeatureGuard('prescription_upload')) // Silver+
  async uploadPrescription(@Request() req: any, @Body() body: UploadPrescriptionDto) {
    const allowedBucket = process.env.AWS_S3_BUCKET_URL || 'https://swahit-prescriptions.s3.amazonaws.com';
    if (!body.fileUrl || !body.fileUrl.startsWith(allowedBucket)) {
      throw new BadRequestException('Invalid file URL, must belong to approved S3 bucket');
    }
    return this.prescriptionService.uploadPrescription(req.user.userId, body.fileUrl);
  }

  @Get('prescriptions')
  async getPrescriptions(@Request() req: any) {
    return this.prescriptionService.getUserPrescriptions(req.user.userId);
  }

  @Post('orders')
  @UseGuards(FeatureGuard('medicine_delivery')) // Gold+
  async createOrder(
    @Request() req: any, 
    @Body() body: CreateOrderDto
  ) {
    return this.orderService.createOrder(req.user.userId, body.prescriptionId, body.items);
  }

  @Get('orders')
  async getOrders(@Request() req: any) {
    return this.orderService.getUserOrders(req.user.userId);
  }
}
