import { CanActivate, ExecutionContext, Injectable, mixin, HttpException, HttpStatus } from '@nestjs/common';
import { EntitlementResolverService } from '../entitlements/entitlement-resolver.service';

export const FeatureGuard = (featureKey: string) => {
  @Injectable()
  class FeatureGuardMixin implements CanActivate {
    constructor(private readonly entitlementResolver: EntitlementResolverService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const access = await this.entitlementResolver.checkFeatureAccess(user.id, featureKey);

      if (!access.allowed) {
        throw new HttpException(
          {
            code: 'FEATURE_LOCKED',
            feature: featureKey,
            requiredPlan: access.requiredPlan || 'UPGRADE_REQUIRED',
            reason: access.reason,
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return true;
    }
  }

  return mixin(FeatureGuardMixin);
};
