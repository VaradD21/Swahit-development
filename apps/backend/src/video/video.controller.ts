import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('video')
@UseGuards(JwtAuthGuard, FeatureGuard('live_consultation'))
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('room/:appointmentId')
  async createRoom(@Param('appointmentId') appointmentId: string) {
    return this.videoService.createRoom(appointmentId);
  }

  @Get('token/:appointmentId')
  async getToken(@Request() req: any, @Param('appointmentId') appointmentId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { appointmentId },
    });

    if (!session) {
      throw new Error('Video session not found for this appointment');
    }

    return this.videoService.getRoomToken(req.user.userId, session.roomName);
  }

  @Post('end/:roomId')
  async endSession(@Param('roomId') roomId: string) {
    return this.videoService.endSession(roomId);
  }
}
