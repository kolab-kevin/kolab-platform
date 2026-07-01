import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

describe('OrganizationController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let organizationRolesGuard: OrganizationRolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);
    organizationRolesGuard = new OrganizationRolesGuard(reflector);

    await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: {
            getCurrentOrganization: jest.fn(),
            listOrganizations: jest.fn(),
            switchOrganization: jest.fn(),
            listMembers: jest.fn(),
            updateMember: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (user: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => OrganizationController.prototype.updateMember,
      getClass: () => OrganizationController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const mockUpdateMemberMetadata = () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((metadataKey: unknown) => {
      const key = metadataKey as string;
      if (key === 'permissions') return ['members:update_role'];
      if (key === 'organizationRoles') return ['ORG_OWNER', 'ORG_ADMIN'];
      return undefined;
    });
  };

  it('denies viewer from member role updates via permissions guard', () => {
    mockUpdateMemberMetadata();

    expect(() =>
      permissionsGuard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'VIEWER',
          isSystemAdmin: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('denies agency manager from member role updates via organization roles guard', () => {
    mockUpdateMemberMetadata();

    const user = {
      role: 'USER',
      organizationRole: 'AGENCY_MANAGER',
      isSystemAdmin: false,
    };

    expect(permissionsGuard.canActivate(createContext(user))).toBe(true);
    expect(() => organizationRolesGuard.canActivate(createContext(user))).toThrow(
      ForbiddenException,
    );
  });

  it('allows system administrator bypass for member updates', () => {
    mockUpdateMemberMetadata();

    const user = {
      role: 'USER',
      organizationRole: 'VIEWER',
      isSystemAdmin: true,
    };

    expect(permissionsGuard.canActivate(createContext(user))).toBe(true);
    expect(organizationRolesGuard.canActivate(createContext(user))).toBe(true);
  });
});
