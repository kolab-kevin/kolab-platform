import type { AccessTokenPayload } from '@kolab/auth';
import { hasAnyOrganizationRole, isSystemAdminUser } from '@kolab/auth';
import type { OrganizationRole } from '@kolab/types';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ORGANIZATION_ROLES_KEY } from '../decorators/auth.decorators';

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrganizationRole[]>(
      ORGANIZATION_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
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

    if (!user.organizationRole) {
      throw new ForbiddenException('Organization role required');
    }

    if (!hasAnyOrganizationRole(user.organizationRole, requiredRoles)) {
      throw new ForbiddenException('Insufficient organization role');
    }

    return true;
  }
}
