import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) {}

  async submitResult(userId: string, score: number, feedback: string, answers: any) {
    return this.prisma.questionnaireResult.create({
      data: {
        userId,
        score,
        feedback,
        answers: JSON.stringify(answers), // Store JSON as string for SQLite
      },
    });
  }

  async getUserResults(userId: string) {
    return this.prisma.questionnaireResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
