import type { AccessTokenPayload } from '@kolab/auth';
import { isSystemAdminUser } from '@kolab/auth';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AccessTokenPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!isSystemAdminUser(user)) {
      throw new ForbiddenException('System administrator access required');
    }

    return true;
  }
}
