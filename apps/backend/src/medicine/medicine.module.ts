import { Module } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { OrderService } from './order.service';
import { MedicineController } from './medicine.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementsModule } from '../common/entitlements/entitlements.module';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [MedicineController],
  providers: [PrescriptionService, OrderService],
  exports: [PrescriptionService, OrderService],
})
export class MedicineModule {}
