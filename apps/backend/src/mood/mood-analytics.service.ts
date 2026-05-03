import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoodAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getInsights(userId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStringLimit = thirtyDaysAgo.toISOString().split('T')[0];

    const entries = await this.prisma.moodEntry.findMany({
      where: {
        userId,
        date: { gte: dateStringLimit }
      },
      orderBy: { date: 'asc' }
    });

    if (entries.length === 0) {
      return { message: "Not enough data for insights" };
    }

    // 1. Averages
    const totalIntensity = entries.reduce((acc, curr) => acc + curr.intensity, 0);
    const averageScore = Math.round((totalIntensity / entries.length) * 10) / 10;

    // 2. Distribution
    const distribution: Record<string, number> = {};
    entries.forEach(e => {
      distribution[e.mood] = (distribution[e.mood] || 0) + 1;
    });

    const mostFrequentMood = Object.keys(distribution).reduce((a, b) => distribution[a] > distribution[b] ? a : b);

    // 3. Trigger Detection (Correlating Journal tags)
    // Fetch journals from the last 30 days
    const journals = await this.prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const badMoodDates = entries.filter(e => e.intensity < 4 || ['SAD', 'ANXIOUS', 'ANGRY'].includes(e.mood)).map(e => e.date);
    
    // Simple naive correlation: find tags common on bad mood days
    const triggerTags: Record<string, number> = {};
    journals.forEach(j => {
      const jDate = j.createdAt.toISOString().split('T')[0];
      if (badMoodDates.includes(jDate) && j.emotionTags) {
        const tags = j.emotionTags.split(',');
        tags.forEach(tag => {
          const t = tag.trim().toLowerCase();
          if (t) triggerTags[t] = (triggerTags[t] || 0) + 1;
        });
      }
    });

    // Get top trigger
    let topTrigger = null;
    if (Object.keys(triggerTags).length > 0) {
      topTrigger = Object.keys(triggerTags).reduce((a, b) => triggerTags[a] > triggerTags[b] ? a : b);
    }

    return {
      averageScore, // out of 10
      mostFrequentMood,
      distribution,
      trend: entries.map(e => ({ date: e.date, intensity: e.intensity, mood: e.mood })),
      topTrigger: topTrigger ? `You often log lower moods on days associated with: ${topTrigger}` : null
    };
  }
}
