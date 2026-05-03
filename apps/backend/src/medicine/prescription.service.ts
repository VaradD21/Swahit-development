import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(private prisma: PrismaService) {}

  async uploadPrescription(userId: string, fileUrl: string) {
    return this.prisma.prescription.create({
      data: {
        userId,
        fileUrl,
      },
    });
  }

  async verifyPrescription(prescriptionId: string, doctorId: string) {
    return this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: { verified: true, doctorId },
    });
  }

  async getUserPrescriptions(userId: string) {
    return this.prisma.prescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { doctor: true },
    });
  }
}
