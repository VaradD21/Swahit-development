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
    const logs = await this.prisma.habitLog.findMany({
      where: { habitId, status: 'completed' },
      orderBy: { date: 'desc' },
    });

    if (logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Parse dates to local Date objects to calculate day difference reliably
    const parsedDates = logs.map(l => {
      const parts = l.date.split('-');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    });

    const isConsecutive = (d1: Date, d2: Date): boolean => {
      const timeDiff = Math.abs(d1.getTime() - d2.getTime());
      const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
      return dayDiff === 1;
    };

    // 1. Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 0; i < parsedDates.length - 1; i++) {
      if (isConsecutive(parsedDates[i], parsedDates[i + 1])) {
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // 2. Calculate current streak (must end today or yesterday)
    let currentStreak = 0;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const lastLoggedDateStr = logs[0].date;
    if (lastLoggedDateStr === todayStr || lastLoggedDateStr === yesterdayStr) {
      currentStreak = 1;
      for (let i = 0; i < parsedDates.length - 1; i++) {
        if (isConsecutive(parsedDates[i], parsedDates[i + 1])) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak, longestStreak };
  }
}
