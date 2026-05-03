import { Module, Global } from '@nestjs/common';
import { EntitlementResolverService } from './entitlement-resolver.service';
import { EntitlementsController } from './entitlements.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [EntitlementsController],
  providers: [EntitlementResolverService],
  exports: [EntitlementResolverService],
})
export class EntitlementsModule {}
