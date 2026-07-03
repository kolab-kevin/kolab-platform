import type { AccessTokenPayload } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsAssignmentsService } from './campaigns-assignments.service';

describe('CampaignsController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [
        {
          provide: CampaignsService,
          useValue: {
            listCampaigns: jest.fn(),
            getCampaign: jest.fn(),
            createCampaign: jest.fn(),
            updateCampaign: jest.fn(),
            updateCampaignStatus: jest.fn(),
            listDeliverables: jest.fn(),
            createDeliverable: jest.fn(),
            updateDeliverable: jest.fn(),
            updateDeliverableStatus: jest.fn(),
            listApplications: jest.fn(),
            inviteApplication: jest.fn(),
            applyToCampaign: jest.fn(),
            acceptApplication: jest.fn(),
            rejectApplication: jest.fn(),
            withdrawApplication: jest.fn(),
          },
        },
        {
          provide: CampaignsAssignmentsService,
          useValue: {
            listAssignments: jest.fn(),
            getAssignment: jest.fn(),
            createAssignment: jest.fn(),
            updateAssignmentStatus: jest.fn(),
            listCreatorDeliverables: jest.fn(),
            createCreatorDeliverable: jest.fn(),
            updateCreatorDeliverable: jest.fn(),
            updateCreatorDeliverableStatus: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof CampaignsController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => CampaignsController.prototype[handler],
      getClass: () => CampaignsController,
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

  it('allows recruiters to list campaigns with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listCampaigns', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing campaigns', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listCampaigns', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to create campaigns with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('createCampaign', recruiterUser))).toBe(true);
  });

  it('denies viewers from updating campaign status', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateCampaignStatus', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to list applications with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listApplications', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from inviting creators', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('inviteApplication', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to accept applications with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('acceptApplication', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from withdrawing applications', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('withdrawApplication', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to list assignments with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listAssignments', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from creating assignments', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('createAssignment', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to update assignment status with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('updateAssignmentStatus', recruiterUser)),
    ).toBe(true);
  });
});
