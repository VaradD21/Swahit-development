import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiProvider } from './providers/gemini.provider';
import { EntitlementResolverService } from '../common/entitlements/entitlement-resolver.service';
import { CommunicationService } from '../communication/communication.service';
import { HttpException, HttpStatus } from '@nestjs/common';

const SYSTEM_PROMPT = `You are Swahit AI Companion, a warm, calm, emotionally intelligent, and deeply empathetic wellness assistant.
Your tone is soft, thoughtful, and non-judgmental. You provide concise but caring responses, prioritizing the user's emotional safety.
You help users with reflection, stress management, grounding, reframing thoughts, and emotional awareness.

CRITICAL RULES:
- Do NOT shame, guilt, or sound robotic.
- Do NOT pretend to be a doctor, diagnose, or claim to hold a therapy license.
- CRISIS PROTOCOL: If the user expresses intent for self-harm, suicide, or severe crisis, respond with grounding, supportive language and IMMEDIATELY recommend they contact emergency services or a crisis hotline. Remind them they are not alone.
- Keep responses conversational. Avoid over-clinical style, excessive markdown, or long bulleted lists unless explicitly asked.

ESCALATION GUIDANCE:
- If the user describes recurring stress, persistent sadness, difficulty functioning, anxiety affecting daily life, relationship problems, or burnout that has lasted more than 2 weeks:
  Gently and naturally suggest (without pressure): "Speaking with a licensed professional may offer deeper support. Swahit can connect you with one if you'd like."
- Phrase it warmly: never robotic, never pushy.
- Only suggest once per relevant pattern — do not repeat if user declines.`;

const DISTRESS_KEYWORDS = [
  'can\'t sleep', 'can\'t eat', 'hopeless', 'worthless', 'can\'t cope', 'panic attack',
  'breakdown', 'end my life', 'harm myself', 'no point', 'give up', 'exhausted',
  'overwhelmed', 'depressed', 'anxious all the time', 'crying every day', 'suicidal'
];

const SYNC_PROMPT = `You are an AI assistant summarizing a therapy-style conversation. 
Please read the following conversation log and provide a concise summary of the key emotional themes, new stressors discussed, and any positive habits mentioned. 
Return ONLY the summary text, nothing else. Keep it under 4 sentences.`;

const MODE_PROMPTS: Record<string, string> = {
  VENT: `You are Swahit AI Companion in VENT mode. Your job is to listen, validate emotions, and offer empathy. Do NOT give advice or try to fix the problem unless explicitly asked. Focus on making the user feel heard and understood.`,
  CBT: `You are Swahit AI Companion in CBT (Cognitive Behavioral Therapy) mode. Help the user identify negative thought patterns or cognitive distortions. Gently guide them to reframe their thoughts using structured, logical steps. Keep it conversational.`,
  MOTIVATION: `You are Swahit AI Companion in MOTIVATION mode. Your tone is uplifting, positive, and action-oriented. Provide short, actionable suggestions to help the user build momentum and achieve their goals.`,
  CRISIS: `You are Swahit AI Companion in CRISIS mode. The user is in distress. Your tone is extremely gentle, grounding, and supportive. Prioritize their safety. Remind them they are not alone and encourage them to reach out to professional emergency services or a crisis hotline immediately.`,
  DEFAULT: SYSTEM_PROMPT
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: GeminiProvider, // Using Gemini Flash as standard
    private entitlementResolver: EntitlementResolverService,
    private communicationService: CommunicationService
  ) {}

  async sendMessage(userId: string, sessionId: string | null, content: string, mode: string = 'DEFAULT') {
    // 1. Fetch or create session
    let session;
    if (sessionId) {
      session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
      if (!session) throw new Error('Session not found');
    } else {
      session = await this.prisma.chatSession.create({
        data: { userId, title: 'New Conversation' },
      });
    }

    // Save user message
    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content },
    });

    const memory = await this.prisma.userMemoryProfile.findUnique({ where: { userId } });

    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
Goals: ${memory.goals || 'None recorded'}
Stressors: ${memory.recurringStressors || 'None recorded'}
Recent Summaries: ${memory.recentSummaries || 'None'}`;
    }

    const messagesToProvider: any[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${memoryContext}` },
      ...recentMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
    ];

    let aiResponseContent = "I'm having trouble thinking right now, but I'm here for you.";
    try {
      // For premium users, we could pass true here: aiProvider.generateResponse(..., user.isPremium)
      aiResponseContent = await this.aiProvider.generateResponse(messagesToProvider, false);
    } catch (e) {
      this.logger.error('Failed to generate response', e);
    }

    const aiMessage = await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'ai', content: aiResponseContent },
    });

    // Detect distress to suggest professional help
    const userContentLower = content.toLowerCase();
    const hasDistressSignal = DISTRESS_KEYWORDS.some(k => userContentLower.includes(k));
    let suggestProfessional = false;

    // --- ENTITLEMENT LOGIC ---
    if (!hasDistressSignal) {
      // If NO distress, enforce limits.
      const accessAdvanced = await this.entitlementResolver.checkFeatureAccess(userId, 'ai_chat_advanced');
      if (accessAdvanced.allowed) {
        await this.entitlementResolver.consumeFeature(userId, 'ai_chat_advanced');
      } else {
        const accessBasic = await this.entitlementResolver.checkFeatureAccess(userId, 'ai_chat_basic');
        if (!accessBasic.allowed) {
          throw new HttpException({
            code: 'FEATURE_LOCKED',
            feature: 'ai_chat_basic',
            requiredPlan: 'UPGRADE_REQUIRED',
            reason: accessBasic.reason
          }, HttpStatus.FORBIDDEN);
        }
        await this.entitlementResolver.consumeFeature(userId, 'ai_chat_basic');
      }
    } else {
      // AI ESCALATION OVERRIDE: Distress detected. Bypass limits.
      this.logger.warn(`Emergency override for user ${userId}. Bypassing chat limits.`);
      suggestProfessional = true;
      // Update distress count in memory profile asynchronously
      this.prisma.userMemoryProfile.upsert({
        where: { userId },
        create: { userId, distressCount: 1, lastDistressAt: new Date() },
        update: { distressCount: { increment: 1 }, lastDistressAt: new Date() },
      }).catch(() => {});

      // Send System Notification linking to appointment booking
      this.communicationService.sendNotification(
        userId,
        'distress',
        'We noticed you might be going through a tough time. Would you like to book a session with a licensed professional?'
      ).catch(() => {});
    }
    // -------------------------

    // Select system prompt based on active mode
    const activeSystemPrompt = MODE_PROMPTS[activeMode] || MODE_PROMPTS.DEFAULT;

    // Include memory context if available
    let memoryContext = '';
    if (memory) {
      memoryContext = `\n\nUSER CONTEXT (Use subtly, do not explicitly mention you are reading this):
      - Preferred Name: ${memory.preferredName || 'Unknown'}
      - Goals: ${memory.goals || 'None recorded'}
      - Recurring Stressors: ${memory.recurringStressors || 'None recorded'}
      - Recent Themes: ${memory.recentSummaries || 'None recorded'}
      `;
    }

    const messages = [
      { role: 'system', content: activeSystemPrompt + memoryContext },
      ...formattedHistory
    ];

    try {
      const responseText = await this.aiProvider.generateResponse(messages, false);
      
      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'ai',
          content: responseText,
        },
      });

      // Fire and forget summarization hook if long
      if (recentMessages.length > 0 && recentMessages.length % 15 === 0) {
         this.triggerMemorySync(session.id, userId).catch(err => {
           this.logger.error(`Summarization hook failed: ${err.message}`);
         });
      }

      return {
        session,
        message: aiMessage,
        suggestProfessional
      };
    } catch (error: any) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Background worker method to summarize long conversations and update the memory profile.
   */
  private async triggerMemorySync(sessionId: string, userId: string) {
    this.logger.log(`Triggering Memory Sync for session ${sessionId}`);
    
    const allMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Summarize the last 50 messages to stay within reasonable limits
    });

    if (allMessages.length < 5) return;

    const conversationLog = allMessages.map(m => `${m.role === 'user' ? 'User' : 'Swahit'}: ${m.content}`).join('\n');
    
    try {
      const summaryContent = await this.aiProvider.generateResponse([
        { role: 'system', content: SYNC_PROMPT },
        { role: 'user', content: conversationLog }
      ], false); // Use Flash for quick internal tasks

      // 1. Save to ChatSummary
      await this.prisma.chatSummary.create({
        data: {
          sessionId,
          summary: summaryContent,
        }
      });

      // 2. Append to UserMemoryProfile
      const existingMemory = await this.prisma.userMemoryProfile.findUnique({ where: { userId } });
      const newRecentSummaries = existingMemory?.recentSummaries 
        ? `${existingMemory.recentSummaries}\n- ${summaryContent}`.slice(-1000) // Keep last ~1000 chars
        : `- ${summaryContent}`;

      await this.prisma.userMemoryProfile.upsert({
        where: { userId },
        create: {
          userId,
          recentSummaries: newRecentSummaries,
        },
        update: {
          recentSummaries: newRecentSummaries,
        }
      });

      this.logger.log(`Memory Sync complete for session ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to run memory sync', error);
    }
  }

  async getThreads(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true, createdAt: true, userId: true },
    });
  }

  async getThreadHistory(userId: string, sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { session: { id: sessionId, userId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteThread(userId: string, sessionId: string) {
    return this.prisma.chatSession.delete({
      where: { id: sessionId, userId },
    });
  }

  async listAvailableModels() {
    return this.aiProvider.listModels();
  }
}
