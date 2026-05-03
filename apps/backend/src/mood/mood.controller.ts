import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { MoodService } from './mood.service';
import { MoodAnalyticsService } from './mood-analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';

@Controller('mood')
@UseGuards(JwtAuthGuard)
export class MoodController {
  constructor(
    private readonly moodService: MoodService,
    private readonly analyticsService: MoodAnalyticsService,
  ) {}

  @Post()
  @UseGuards(FeatureGuard('mood_tracking'))
  async logMood(
    @Request() req: any,
    @Body() body: { mood: string; intensity?: number; notes?: string },
  ) {
    return this.moodService.createMood(req.user.userId, body.mood, body.intensity ?? 5, body.notes);
  }

  @Get()
  @UseGuards(FeatureGuard('mood_tracking'))
  async getMoods(@Request() req: any) {
    return this.moodService.getUserMoods(req.user.userId);
  }
}
