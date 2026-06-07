import { Controller, Post, Get, Body, UseGuards, Request, Param, Delete, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @UseGuards(JwtAuthGuard)
  @Get('models')
  async listModels() {
    return this.chatbotService.listAvailableModels();
  }

  @UseGuards(JwtAuthGuard)
  @Post('message')
  async sendMessage(@Request() req: any, @Body() body: SendMessageDto) {
    if (!body.content || body.content.trim() === '') {
      throw new HttpException('Message content cannot be empty', HttpStatus.BAD_REQUEST);
    }
    return this.chatbotService.sendMessage(req.user.userId, body.sessionId, body.content, body.mode);
  }

  @UseGuards(JwtAuthGuard)
  @Get('threads')
  async getThreads(
    @Request() req: any,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const limit = Math.min(take ? parseInt(take, 10) : 20, 100);
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.chatbotService.getThreads(req.user.userId, limit, offset);
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
