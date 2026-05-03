import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HabitService {
  constructor(private prisma: PrismaService) {}

  async createHabit(userId: string, title: string, category: string) {
    return this.prisma.habit.create({
      data: {
        userId,
        title,
        category,
      },
    });
  }

  async getHabits(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 30, // Get last 30 days of logs for quick rendering
        },
      },
    });
  }

  async logHabit(userId: string, habitId: string, date: string, status: string) {
    // Basic authorization check
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== userId) {
      throw new Error('Habit not found or access denied');
    }

    return this.prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, date, status },
      update: { status },
    });
  }

  async calculateStreaks(habitId: string) {
    // This calculates streaks dynamically by scanning completed logs in descending order.
    // In production, this might be cached or run as a cron job, but for MVP we compute on demand.
    const logs = await this.prisma.habitLog.findMany({
      where: { habitId, status: 'completed' },
      orderBy: { date: 'desc' },
    });

    if (logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 0; i < logs.length - 1; i++) {
      const d1 = new Date(logs[i].date);
      const d2 = new Date(logs[i + 1].date);
      
      // Calculate difference in days
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (i === tempStreak - 2) currentStreak = tempStreak; // still on the active streak
      } else {
        tempStreak = 1;
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Edge case if latest log is older than yesterday, current streak is broken (0)
    const today = new Date();
    const lastLog = new Date(logs[0].date);
    const diffToToday = Math.ceil(Math.abs(today.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffToToday > 1) {
      currentStreak = 0;
    }

    return { currentStreak, longestStreak };
  }
}
