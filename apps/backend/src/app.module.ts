import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { MoodModule } from './mood/mood.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { EntitlementsModule } from './common/entitlements/entitlements.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TasksModule } from './common/tasks/tasks.module';
import { VideoModule } from './video/video.module';
import { CommunicationModule } from './communication/communication.module';
import { MedicineModule } from './medicine/medicine.module';
import { JournalModule } from './journal/journal.module';
import { HabitModule } from './habit/habit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    MoodModule,
    QuestionnaireModule,
    AppointmentsModule,
    ChatbotModule,
    PaymentsModule,
    AdminModule,
    EntitlementsModule,
    SubscriptionsModule,
    TasksModule,
    VideoModule,
    CommunicationModule,
    MedicineModule,
    JournalModule,
    HabitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
