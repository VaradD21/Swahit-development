import { Controller, Post, Get, Body, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // Diagnostic route - accessible without auth for debugging 404s
  @Get('models')
  async listModels() {
    return this.chatbotService.listAvailableModels();
  }

  @UseGuards(JwtAuthGuard)
  @Post('message')
  async sendMessage(@Request() req: any, @Body() body: { sessionId: string | null; content: string; mode?: string }) {
    if (!body.content || body.content.trim() === '') {
      throw new HttpException('Message content cannot be empty', HttpStatus.BAD_REQUEST);
    }
    return this.chatbotService.sendMessage(req.user.userId, body.sessionId, body.content, body.mode);
  }

  @UseGuards(JwtAuthGuard)
  @Get('threads')
  async getThreads(@Request() req: any) {
    return this.chatbotService.getThreads(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('thread/:id')
  async getHistory(@Request() req: any, @Param('id') id: string) {
    return this.chatbotService.getThreadHistory(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('thread/:id')
  async deleteThread(@Request() req: any, @Param('id') id: string) {
    return this.chatbotService.deleteThread(req.user.userId, id);
  }
}
