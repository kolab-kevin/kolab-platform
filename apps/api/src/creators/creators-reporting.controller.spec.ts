import type { AccessTokenPayload } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatorsNotificationsService } from './creators-notifications.service';
import { CreatorsReportingController } from './creators-reporting.controller';
import { CreatorsReportingService } from './creators-reporting.service';

describe('CreatorsReportingController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [CreatorsReportingController],
      providers: [
        {
          provide: CreatorsReportingService,
          useValue: {
            listExpiringDocuments: jest.fn(),
            listMissingDocuments: jest.fn(),
            listExpiringContracts: jest.fn(),
          },
        },
        {
          provide: CreatorsNotificationsService,
          useValue: {
            previewExpirationNotifications: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof CreatorsReportingController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => CreatorsReportingController.prototype[handler],
      getClass: () => CreatorsReportingController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const createUser = (
    organizationRole: AccessTokenPayload['organizationRole'],
  ): AccessTokenPayload => ({
    sub: 'user-1',
    email: 'user@kolab.test',
    role: 'USER',
    organizationId: 'org-1',
    organizationRole,
    sessionId: 'session-1',
    isSystemAdmin: false,
  });

  const recruiterUser = createUser('RECRUITER');
  const viewerUser = createUser('VIEWER');

  it('allows recruiters to list expiring documents with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(
      permissionsGuard.canActivate(createContext('listExpiringDocuments', recruiterUser)),
    ).toBe(true);
  });

  it('denies viewers from listing expiring documents', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('listExpiringDocuments', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to list missing documents with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('listMissingDocuments', recruiterUser))).toBe(
      true,
    );
  });

  it('allows recruiters to preview notifications with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(
      permissionsGuard.canActivate(createContext('previewExpirationNotifications', recruiterUser)),
    ).toBe(true);
  });

  it('denies viewers from previewing notifications', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('previewExpirationNotifications', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to list expiring contracts with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(
      permissionsGuard.canActivate(createContext('listExpiringContracts', recruiterUser)),
    ).toBe(true);
  });
});
