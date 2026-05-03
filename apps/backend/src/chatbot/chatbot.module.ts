import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GeminiProvider } from './providers/gemini.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, GeminiProvider],
  exports: [GeminiProvider, ChatbotService],
})
export class ChatbotModule {}
