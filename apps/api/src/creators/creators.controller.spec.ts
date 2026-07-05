import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { LiveIntelligenceCreatorProfileService } from '../live-intelligence/live-intelligence-creator-profile.service';
import { LiveIntelligenceLiveTrendsService } from '../live-intelligence/live-intelligence-live-trends.service';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorsComplianceService } from './creators-compliance.service';
import { CreatorsDashboardService } from './creators-dashboard.service';
import { CreatorsGoalsService } from './creators-goals.service';
import { CreatorsOnboardingService } from './creators-onboarding.service';
import { CreatorsPerformanceScoreService } from './creators-performance-score.service';

describe('CreatorsController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [CreatorsController],
      providers: [
        {
          provide: CreatorsService,
          useValue: {
            listCreators: jest.fn(),
            getCreator: jest.fn(),
            updateCreator: jest.fn(),
            listCreatorPlatformAccounts: jest.fn(),
            createCreatorPlatformAccount: jest.fn(),
            updateCreatorPlatformAccount: jest.fn(),
            deleteCreatorPlatformAccount: jest.fn(),
            getCreatorSkills: jest.fn(),
            updateCreatorSkills: jest.fn(),
            getCreatorAvailability: jest.fn(),
            updateCreatorAvailability: jest.fn(),
            convertLeadFromRecruitment: jest.fn(),
          },
        },
        {
          provide: CreatorsOnboardingService,
          useValue: {
            getCreatorOnboarding: jest.fn(),
          },
        },
        {
          provide: CreatorsComplianceService,
          useValue: {
            getCreatorCompliance: jest.fn(),
          },
        },
        {
          provide: LiveIntelligenceCreatorProfileService,
          useValue: {
            generateCreatorIntelligence: jest.fn(),
            getCreatorIntelligence: jest.fn(),
          },
        },
        {
          provide: LiveIntelligenceLiveTrendsService,
          useValue: {
            generateCreatorLiveTrends: jest.fn(),
            getCreatorLiveTrends: jest.fn(),
          },
        },
        {
          provide: CreatorsPerformanceScoreService,
          useValue: {
            generateCreatorPerformanceScore: jest.fn(),
            getCreatorPerformanceScore: jest.fn(),
          },
        },
        {
          provide: CreatorsGoalsService,
          useValue: {
            listCreatorGoals: jest.fn(),
            getCreatorGoal: jest.fn(),
            createCreatorGoal: jest.fn(),
            updateCreatorGoal: jest.fn(),
            updateCreatorGoalStatus: jest.fn(),
            recalculateCreatorGoalProgress: jest.fn(),
          },
        },
        {
          provide: CreatorsDashboardService,
          useValue: {
            getCreatorDashboard: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof CreatorsController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => CreatorsController.prototype[handler],
      getClass: () => CreatorsController,
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

  it('allows recruiters to list creators with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listCreators', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing creators', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listCreators', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to update creators with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('updateCreator', recruiterUser))).toBe(true);
  });

  it('denies viewers from updating creators', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('updateCreator', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to list platform accounts with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(
      permissionsGuard.canActivate(createContext('listCreatorPlatformAccounts', recruiterUser)),
    ).toBe(true);
  });

  it('denies viewers from creating platform accounts', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('createCreatorPlatformAccount', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to delete platform accounts with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('deleteCreatorPlatformAccount', recruiterUser)),
    ).toBe(true);
  });

  it('allows recruiters to read skills with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('getCreatorSkills', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from updating skills', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateCreatorSkills', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('denies viewers from updating availability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateCreatorAvailability', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to generate creator intelligence with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('generateCreatorIntelligence', recruiterUser)),
    ).toBe(true);
  });

  it('allows recruiters to read creator intelligence with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(
      permissionsGuard.canActivate(createContext('getCreatorIntelligence', recruiterUser)),
    ).toBe(true);
  });

  it('denies viewers from generating creator intelligence', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('generateCreatorIntelligence', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('denies viewers from reading creator intelligence', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getCreatorIntelligence', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to generate creator live trends with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('generateCreatorLiveTrends', recruiterUser)),
    ).toBe(true);
  });

  it('allows recruiters to read creator live trends with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('getCreatorLiveTrends', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from generating creator live trends', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('generateCreatorLiveTrends', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('denies viewers from reading creator live trends', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getCreatorLiveTrends', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to generate creator performance score with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('generateCreatorPerformanceScore', recruiterUser)),
    ).toBe(true);
  });

  it('allows recruiters to read creator performance score with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(
      permissionsGuard.canActivate(createContext('getCreatorPerformanceScore', recruiterUser)),
    ).toBe(true);
  });

  it('denies viewers from generating creator performance score', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('generateCreatorPerformanceScore', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('denies viewers from reading creator performance score', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getCreatorPerformanceScore', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to list creator goals with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listCreatorGoals', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from listing creator goals', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('listCreatorGoals', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to create creator goals with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('createCreatorGoal', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from recalculating creator goal progress', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('recalculateCreatorGoalProgress', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to read creator dashboard with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('getCreatorDashboard', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from reading creator dashboard', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getCreatorDashboard', viewerUser)),
    ).toThrow(ForbiddenException);
  });
});
