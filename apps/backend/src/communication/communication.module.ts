import { Module, Global } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
