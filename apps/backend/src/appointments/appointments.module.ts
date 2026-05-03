import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { DoctorController } from './doctor.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController, DoctorController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
