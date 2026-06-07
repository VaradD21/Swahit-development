import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai-provider.interface';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

@Injectable()
export class GeminiProvider implements AIService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiProvider.name);
  
  private consecutiveFailures = 0;
  private circuitOpenUntil: Date | null = null;
  private readonly MAX_FAILURES = 5;
  private readonly CIRCUIT_TIMEOUT_MS = 60000;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('GEMINI_API_KEY is required in production');
      }
      this.logger.error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async generateResponse(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    usePremiumModel = false,
  ): Promise<string> {
    try {
      // Verified model names from live API — 2026-04-26
      const modelName = usePremiumModel ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

      // Extract system instruction first
      const systemParts = messages.filter(m => m.role === 'system');
      const systemInstruction = systemParts.map(m => m.content).join('\n');

      // systemInstruction must be set at model level (not startChat) for older SDK compatibility
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: 0.6,
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      // Filter out system messages and build strictly alternating user/model pairs
      const convoMessages = messages.filter(m => m.role !== 'system');

      // The last message must be the user's latest message
      const latestUserMessage = convoMessages[convoMessages.length - 1]?.content || 'Hello';

      // Build history from all prior messages (exclude the last one, which we send as the new turn)
      const priorMessages = convoMessages.slice(0, -1);

      // Ensure strict alternation: if two consecutive turns are the same role, merge them
      const history: { role: string; parts: { text: string }[] }[] = [];
      for (const msg of priorMessages) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const last = history[history.length - 1];
        if (last && last.role === role) {
          // Merge consecutive same-role messages to satisfy Gemini alternation requirement
          last.parts[0].text += `\n${msg.content}`;
        } else {
          history.push({ role, parts: [{ text: msg.content }] });
        }
      }

      // History must start with 'user' — if it starts with 'model', drop that message
      while (history.length > 0 && history[0].role !== 'user') {
        history.shift();
      }

      // History must end with 'model' — if it ends with 'user', pop that turn
      // (the user's latest message is sent separately via sendMessage)
      while (history.length > 0 && history[history.length - 1].role !== 'model') {
        history.pop();
      }

      return this.executeWithResilience(async () => {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(latestUserMessage);
        return result.response.text();
      });
    } catch (error) {
      this.logger.error('Gemini API Error', error);
      throw error;
    }
  }

  private async executeWithResilience<T>(operation: () => Promise<T>): Promise<T> {
    if (this.circuitOpenUntil && new Date() < this.circuitOpenUntil) {
      throw new Error('Circuit breaker is open. AI Provider is temporarily unavailable.');
    }

    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        const result = await operation();
        this.consecutiveFailures = 0;
        this.circuitOpenUntil = null;
        return result;
      } catch (error: any) {
        attempt++;
        this.logger.warn(`AI API attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= maxAttempts) {
          this.consecutiveFailures++;
          if (this.consecutiveFailures >= this.MAX_FAILURES) {
            this.circuitOpenUntil = new Date(Date.now() + this.CIRCUIT_TIMEOUT_MS);
            this.logger.error(`Circuit breaker opened until ${this.circuitOpenUntil.toISOString()}`);
          }
          throw error;
        }
        
        // Exponential backoff: 2s, 4s
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error('Unreachable');
  }

  async listModels(): Promise<object> {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      const data = (await res.json()) as { models?: any[] };
      return (data.models || []).map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods,
      }));
    } catch (error: any) {
      this.logger.error('Failed to list models', error);
      return { error: error.message };
    }
  }
}
