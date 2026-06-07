import { Controller, Post, Get, Param, Body, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';

@Controller('journal')
@UseGuards(JwtAuthGuard, FeatureGuard('journaling')) // FREE feature
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  async createEntry(@Request() req: any, @Body('content') content: string) {
    if (!content || content.trim() === '') {
      throw new BadRequestException('Content is required');
    }
    return this.journalService.createEntry(req.user.userId, content);
  }

  @Get()
  async getEntries(
    @Request() req: any, 
    @Query('skip') skip?: string, 
    @Query('take') take?: string
  ) {
    return this.journalService.getEntries(
      req.user.userId, 
      skip ? parseInt(skip) : 0, 
      take ? parseInt(take) : 20
    );
  }

  @Get(':id')
  async getEntry(@Request() req: any, @Param('id') id: string) {
    return this.journalService.getEntryById(req.user.userId, id);
  }
}
