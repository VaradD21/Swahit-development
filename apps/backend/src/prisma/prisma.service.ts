import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaLibSql({
      url: process.env.DATABASE_URL || 'file:./dev.db',
    });
    super({ adapter, errorFormat: 'minimal' });
  }

  async onModuleInit() {
    let retries = 5;
    let delay = 1000;
    while (retries > 0) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        retries--;
        console.error(`🔴 Failed to connect to database. Retries left: ${retries}. Error:`, err);
        if (retries === 0) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
