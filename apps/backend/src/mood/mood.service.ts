import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoodService {
  constructor(private prisma: PrismaService) {}

  async createMood(userId: string, mood: string, intensity: number = 5, notes?: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC
    return this.prisma.moodEntry.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        }
      },
      update: { mood, intensity, notes },
      create: { userId, mood, intensity, notes, date: today },
    });
  }

  async getUserMoods(userId: string) {
    return this.prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { date: 'asc' }, // Order chronologically
      take: 90,
    });
  }
}
