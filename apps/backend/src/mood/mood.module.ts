import { Module } from '@nestjs/common';
import { MoodService } from './mood.service';
import { MoodAnalyticsService } from './mood-analytics.service';
import { MoodController } from './mood.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementsModule } from '../common/entitlements/entitlements.module';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [MoodController],
  providers: [MoodService, MoodAnalyticsService],
  exports: [MoodService, MoodAnalyticsService],
})
export class MoodModule {}
