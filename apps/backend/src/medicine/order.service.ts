import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, prescriptionId: string, items: { name: string, quantity: number, price: number }[]) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new HttpException('Prescription not found', HttpStatus.NOT_FOUND);
    }
    
    if (!prescription.verified) {
      throw new HttpException('Prescription must be verified before ordering', HttpStatus.BAD_REQUEST);
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return this.prisma.medicineOrder.create({
      data: {
        userId,
        prescriptionId,
        totalAmount,
        status: 'pending',
        items: {
          create: items.map(item => ({
            medicineName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.medicineOrder.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async getUserOrders(userId: string) {
    return this.prisma.medicineOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, prescription: true },
    });
  }
}
