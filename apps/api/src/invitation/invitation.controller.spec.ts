import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';

describe('InvitationController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [InvitationController],
      providers: [
        {
          provide: InvitationService,
          useValue: {
            createInvitation: jest.fn(),
            listInvitations: jest.fn(),
            revokeInvitation: jest.fn(),
            acceptInvitation: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof InvitationController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => InvitationController.prototype[handler],
      getClass: () => InvitationController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('denies viewers from creating invitations', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);

    expect(() =>
      permissionsGuard.canActivate(
        createContext('createInvitation', {
          role: 'USER',
          organizationRole: 'VIEWER',
          isSystemAdmin: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to create invitations', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);

    expect(
      permissionsGuard.canActivate(
        createContext('createInvitation', {
          role: 'USER',
          organizationRole: 'RECRUITER',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);
  });

  it('allows system administrator bypass for invitation management', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);

    expect(
      permissionsGuard.canActivate(
        createContext('createInvitation', {
          role: 'USER',
          organizationRole: 'VIEWER',
          isSystemAdmin: true,
        }),
      ),
    ).toBe(true);
  });
});
