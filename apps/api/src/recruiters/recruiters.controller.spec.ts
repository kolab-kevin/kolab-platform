import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RecruitersController } from './recruiters.controller';
import { RecruitersService } from './recruiters.service';

describe('RecruitersController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [RecruitersController],
      providers: [
        {
          provide: RecruitersService,
          useValue: {
            listRecruiters: jest.fn(),
            getRecruiter: jest.fn(),
            createRecruiterProfile: jest.fn(),
            updateRecruiterProfile: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof RecruitersController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => RecruitersController.prototype[handler],
      getClass: () => RecruitersController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const recruiterUser = {
    role: 'USER',
    organizationRole: 'RECRUITER',
    isSystemAdmin: false,
  };

  const viewerUser = {
    role: 'USER',
    organizationRole: 'VIEWER',
    isSystemAdmin: false,
  };

  const managerUser = {
    role: 'USER',
    organizationRole: 'AGENCY_MANAGER',
    isSystemAdmin: false,
  };

  it('allows recruiters to list profiles with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listRecruiters', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing profiles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listRecruiters', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows managers to create profiles with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('createRecruiterProfile', managerUser))).toBe(
      true,
    );
  });

  it('allows recruiters through crm:update guard but service enforces manager role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('createRecruiterProfile', recruiterUser)),
    ).toBe(true);
  });
});
