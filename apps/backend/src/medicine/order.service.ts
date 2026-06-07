import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, prescriptionId: string, items: { productId: string, quantity: number }[]) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new HttpException('Prescription not found', HttpStatus.NOT_FOUND);
    }
    
    if (!prescription.verified) {
      throw new HttpException('Prescription must be verified before ordering', HttpStatus.BAD_REQUEST);
    }

    const productIds = items.map(i => i.productId);
    const products = await this.prisma.medicineProduct.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      throw new HttpException('One or more products are invalid or unavailable', HttpStatus.BAD_REQUEST);
    }

    let totalAmount = 0;
    const validatedItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      totalAmount += (item.quantity * product.price);
      
      return {
        medicineName: product.name,
        quantity: item.quantity,
        price: product.price,
      };
    });

    return this.prisma.medicineOrder.create({
      data: {
        userId,
        prescriptionId,
        totalAmount,
        status: 'pending',
        items: {
          create: validatedItems,
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
