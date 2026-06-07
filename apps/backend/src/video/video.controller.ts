import { Controller, Post, Get, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
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
  async createRoom(@Request() req: any, @Param('appointmentId') appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }
    const userId = req.user.userId;
    if (appointment.userId !== userId && appointment.doctorId !== userId) {
      throw new HttpException('Access denied: You are not a party to this appointment', HttpStatus.FORBIDDEN);
    }
    
    if (appointment.status !== 'CONFIRMED') {
      throw new HttpException('Appointment is not confirmed', HttpStatus.FORBIDDEN);
    }

    const now = new Date();
    const startTime = new Date(appointment.preferredTime);
    const timeDiffMinutes = (startTime.getTime() - now.getTime()) / 60000;
    
    // Allow entry 15 mins before and up to 60 mins after
    if (timeDiffMinutes > 15 || timeDiffMinutes < -60) {
      throw new HttpException('You can only join the video session 15 minutes before the scheduled time', HttpStatus.FORBIDDEN);
    }
    return this.videoService.createRoom(appointmentId);
  }

  @Get('token/:appointmentId')
  async getToken(@Request() req: any, @Param('appointmentId') appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }
    const userId = req.user.userId;
    if (appointment.userId !== userId && appointment.doctorId !== userId) {
      throw new HttpException('Access denied: You are not a party to this appointment', HttpStatus.FORBIDDEN);
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new HttpException('Appointment is not confirmed', HttpStatus.FORBIDDEN);
    }

    const now = new Date();
    const startTime = new Date(appointment.preferredTime);
    const timeDiffMinutes = (startTime.getTime() - now.getTime()) / 60000;
    
    // Allow entry 15 mins before and up to 60 mins after
    if (timeDiffMinutes > 15 || timeDiffMinutes < -60) {
      throw new HttpException('You can only join the video session 15 minutes before the scheduled time', HttpStatus.FORBIDDEN);
    }

    const session = await this.prisma.videoSession.findUnique({
      where: { appointmentId },
    });

    if (!session) {
      throw new HttpException('Video session not found for this appointment', HttpStatus.NOT_FOUND);
    }

    return this.videoService.getRoomToken(userId, session.roomName);
  }

  @Post('end/:roomId')
  async endSession(@Request() req: any, @Param('roomId') roomId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: roomId },
      include: { appointment: true },
    });
    if (!session) {
      throw new HttpException('Video session not found', HttpStatus.NOT_FOUND);
    }
    const userId = req.user.userId;
    if (session.appointment.userId !== userId && session.appointment.doctorId !== userId) {
      throw new HttpException('Access denied: You are not authorized to end this session', HttpStatus.FORBIDDEN);
    }
    return this.videoService.endSession(roomId);
  }
}
