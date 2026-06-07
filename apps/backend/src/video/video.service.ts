import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly dailyApiKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('DAILY_API_KEY');
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DAILY_API_KEY is required in production');
      }
      this.logger.warn('DAILY_API_KEY is not defined, using mock key');
    }
    this.dailyApiKey = apiKey || 'mock_key';
  }

  async createRoom(appointmentId: string) {
    // Check if room already exists
    const existing = await this.prisma.videoSession.findUnique({
      where: { appointmentId },
    });
    if (existing) return existing;

    // Call Daily.co API to create room
    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.dailyApiKey}`,
        },
        body: JSON.stringify({
          properties: {
            exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
            enable_chat: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Daily room');
      }

      const roomData = await response.json();

      return this.prisma.videoSession.create({
        data: {
          appointmentId,
          roomName: roomData.name,
          provider: 'daily',
          status: 'scheduled',
        },
      });
    } catch (error) {
      this.logger.error(`Error creating video room: ${error.message}`);
      throw new HttpException('Failed to create video session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRoomToken(userId: string, roomName: string) {
    try {
      const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.dailyApiKey}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_id: userId,
            is_owner: false, // Could be true for doctors
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour token
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      return { token: data.token, roomName };
    } catch (error) {
      this.logger.error(`Error generating token for room ${roomName}: ${error.message}`);
      throw new HttpException('Failed to generate access token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async endSession(roomId: string) {
    return this.prisma.videoSession.update({
      where: { id: roomId },
      data: { status: 'ended', endTime: new Date() },
    });
  }
}
