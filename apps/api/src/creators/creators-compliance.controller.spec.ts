import type { AccessTokenPayload } from '@kolab/auth';
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

describe('CreatorsController compliance authorization', () => {
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

  it('allows recruiters to read compliance with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('getCreatorCompliance', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from reading compliance', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getCreatorCompliance', viewerUser)),
    ).toThrow(ForbiddenException);
  });
});
