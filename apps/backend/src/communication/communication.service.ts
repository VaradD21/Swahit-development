import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(private prisma: PrismaService) {}

  async sendNotification(userId: string, type: string, message: string) {
    this.logger.log(`Sending ${type} notification to user ${userId}`);
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async sendMessage(senderId: string, receiverId: string, content: string, type: string = 'text') {
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        type,
      },
    });
  }

  async getChatHistory(userId1: string, userId2: string, take: number = 50, skip: number = 0) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: Math.min(take, 100),
      skip,
    });
  }
}
