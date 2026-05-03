import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { HabitService } from './habit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitController {
  constructor(private readonly habitService: HabitService) {}

  @Post()
  async createHabit(@Request() req: any, @Body() body: { title: string, category: string }) {
    return this.habitService.createHabit(req.user.userId, body.title, body.category);
  }

  @Get()
  async getHabits(@Request() req: any) {
    const habits = await this.habitService.getHabits(req.user.userId);
    
    // Attach streaks to response dynamically
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        const streaks = await this.habitService.calculateStreaks(habit.id);
        return { ...habit, ...streaks };
      })
    );

    return habitsWithStreaks;
  }

  @Post(':id/log')
  async logHabit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { date: string, status: string }
  ) {
    return this.habitService.logHabit(req.user.userId, id, body.date, body.status);
  }
}
