import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiProvider } from '../chatbot/providers/gemini.provider';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: GeminiProvider,
  ) {}

  async createEntry(userId: string, content: string) {
    // 1. Create the base entry
    const entry = await this.prisma.journalEntry.create({
      data: {
        userId,
        content,
        emotionTags: '', // Temporary
      },
    });

    // 2. Trigger async AI processing so we don't block the request
    this.processEntryWithAI(entry.id, content).catch(err => {
      this.logger.error(`Failed to process journal entry ${entry.id} with AI: ${err.message}`);
    });

    return entry;
  }

  private async processEntryWithAI(entryId: string, content: string) {
    const prompt = `You are an AI that analyzes journal entries. 
    Analyze the following entry and return a JSON object with two fields:
    1. "summary": A concise 1-2 sentence summary.
    2. "emotionTags": An array of 1-3 distinct strings representing the primary emotions (e.g. ["anxious", "hopeful"]).
    
    Entry: "${content}"`;

    try {
      const result = await this.aiProvider.generateResponse([{ role: 'user', content: prompt }]);
      // Parse JSON from text
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        await this.prisma.journalEntry.update({
          where: { id: entryId },
          data: {
            summary: parsed.summary,
            emotionTags: Array.isArray(parsed.emotionTags) ? parsed.emotionTags.join(',') : '',
          },
        });
      }
    } catch (e) {
      this.logger.error('Error generating AI summary for journal', e);
    }
  }

  async getEntries(userId: string, skip: number = 0, take: number = 20) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getEntryById(userId: string, id: string) {
    return this.prisma.journalEntry.findFirst({
      where: { id, userId },
    });
  }
}
