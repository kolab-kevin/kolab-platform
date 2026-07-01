import type { AccessTokenPayload } from '@kolab/auth';
import { isSystemAdminUser, userHasAllPermissions } from '@kolab/auth';
import type { Permission } from '@kolab/types';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/auth.decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: AccessTokenPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (isSystemAdminUser(user)) {
      return true;
    }

    if (!userHasAllPermissions(user, requiredPermissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
