import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatorsService } from '../creators/creators.service';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentFollowUpsService } from './recruitment-followups.service';
import { RecruitmentNotesService } from './recruitment-notes.service';

describe('RecruitmentController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [RecruitmentController],
      providers: [
        {
          provide: RecruitmentService,
          useValue: {
            listLeads: jest.fn(),
            getLead: jest.fn(),
            createLead: jest.fn(),
            updateLead: jest.fn(),
            deleteLead: jest.fn(),
            claimLead: jest.fn(),
            reassignLead: jest.fn(),
            unassignLead: jest.fn(),
            updateLeadStatus: jest.fn(),
          },
        },
        {
          provide: RecruitmentNotesService,
          useValue: {
            listLeadNotes: jest.fn(),
            addLeadNote: jest.fn(),
            updateLeadNote: jest.fn(),
            deleteLeadNote: jest.fn(),
            getLeadTimeline: jest.fn(),
          },
        },
        {
          provide: RecruitmentFollowUpsService,
          useValue: {
            updateLeadFollowUp: jest.fn(),
          },
        },
        {
          provide: CreatorsService,
          useValue: {
            convertLeadFromRecruitment: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof RecruitmentController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => RecruitmentController.prototype[handler],
      getClass: () => RecruitmentController,
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

  const supportUser = {
    role: 'USER',
    organizationRole: 'SUPPORT',
    isSystemAdmin: false,
  };

  const agencyManagerUser = {
    role: 'USER',
    organizationRole: 'AGENCY_MANAGER',
    isSystemAdmin: false,
  };

  const systemAdminUser = {
    role: 'USER',
    organizationRole: 'VIEWER',
    isSystemAdmin: true,
  };

  it('allows recruiters to read leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listLeads', recruiterUser))).toBe(true);
    expect(permissionsGuard.canActivate(createContext('getLead', recruiterUser))).toBe(true);
  });

  it('allows recruiters to create and update leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:create']);

    expect(permissionsGuard.canActivate(createContext('createLead', recruiterUser))).toBe(true);

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('updateLead', recruiterUser))).toBe(true);
  });

  it('denies recruiters from deleting leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:delete']);

    expect(() => permissionsGuard.canActivate(createContext('deleteLead', recruiterUser))).toThrow(
      ForbiddenException,
    );
  });

  it('denies viewers from reading leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listLeads', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows support to read leads but not mutate them', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listLeads', supportUser))).toBe(true);

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:create']);

    expect(() => permissionsGuard.canActivate(createContext('createLead', supportUser))).toThrow(
      ForbiddenException,
    );

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('updateLead', supportUser))).toThrow(
      ForbiddenException,
    );

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:delete']);

    expect(() => permissionsGuard.canActivate(createContext('deleteLead', supportUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows agency managers full CRM access', () => {
    for (const permission of ['crm:read', 'crm:create', 'crm:update', 'crm:delete'] as const) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);

      const handler =
        permission === 'crm:read'
          ? 'listLeads'
          : permission === 'crm:create'
            ? 'createLead'
            : permission === 'crm:update'
              ? 'updateLead'
              : 'deleteLead';

      expect(permissionsGuard.canActivate(createContext(handler, agencyManagerUser))).toBe(true);
    }
  });

  it('allows system administrators to bypass CRM permission checks', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:delete']);

    expect(permissionsGuard.canActivate(createContext('deleteLead', systemAdminUser))).toBe(true);
  });

  it('allows recruiters to claim leads with crm:assign', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:assign']);

    expect(permissionsGuard.canActivate(createContext('claimLead', recruiterUser))).toBe(true);
  });

  it('denies support from claiming leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:assign']);

    expect(() => permissionsGuard.canActivate(createContext('claimLead', supportUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to transition lead status with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('updateLeadStatus', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from transitioning lead status', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateLeadStatus', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows system administrators to bypass status transition permission checks', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('updateLeadStatus', systemAdminUser))).toBe(
      true,
    );
  });

  it('allows users with crm:update to convert leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('convertLead', recruiterUser))).toBe(true);
  });

  it('denies viewers from converting leads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('convertLead', viewerUser))).toThrow(
      ForbiddenException,
    );
  });
});
