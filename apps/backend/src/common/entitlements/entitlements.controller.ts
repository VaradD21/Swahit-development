import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { EntitlementResolverService } from './entitlement-resolver.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('user/entitlements')
export class EntitlementsController {
  constructor(private readonly entitlementResolver: EntitlementResolverService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyEntitlements(@Request() req: any) {
    return this.entitlementResolver.resolveUserEntitlements(req.user.userId || req.user.id);
  }
}
