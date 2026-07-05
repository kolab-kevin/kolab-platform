import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CreatorsDashboardService } from './creators-dashboard.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
    },
    creatorGoal: {
      findMany: jest.fn(),
    },
    campaignCreatorAssignment: {
      findMany: jest.fn(),
    },
    campaignApplication: {
      findMany: jest.fn(),
    },
    campaignCreatorDeliverable: {
      findMany: jest.fn(),
    },
    liveSession: {
      findFirst: jest.fn(),
    },
    creatorDocument: {
      findFirst: jest.fn(),
    },
    creatorContract: {
      findFirst: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';

const managerToken: AccessTokenPayload = {
  sub: 'manager-1',
  email: 'manager@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'AGENCY_MANAGER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const baseCreator = {
  id: 'creator-1',
  organizationId: 'org-1',
  displayName: 'Creator One',
  status: 'ACTIVE',
  country: 'US',
  availability: {},
  metadata: {},
  platformAccounts: [
    { id: 'account-1', status: 'ACTIVE', platform: 'TIKTOK', username: 'creatorone' },
  ],
};

describe('CreatorsDashboardService', () => {
  let service: CreatorsDashboardService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsDashboardService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CreatorsDashboardService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreator);
    (prisma.creatorGoal.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.campaignCreatorAssignment.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.campaignApplication.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.campaignCreatorDeliverable.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('generates a dashboard for an organization creator', async () => {
    const dashboard = await service.getCreatorDashboard(managerToken, 'creator-1');

    expect(dashboard.creatorProfileId).toBe('creator-1');
    expect(dashboard.organizationId).toBe('org-1');
    expect(dashboard.overview.displayName).toBe('Creator One');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DASHBOARD_VIEWED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('returns an empty dashboard when optional sections have no data', async () => {
    const dashboard = await service.getCreatorDashboard(managerToken, 'creator-1');

    expect(dashboard.todaysGoals.activeGoals).toEqual([]);
    expect(dashboard.upcomingCampaigns.assignedCampaigns).toEqual([]);
    expect(dashboard.liveActivity.latestLiveSession).toBeNull();
    expect(dashboard.coach.activeRecommendations).toEqual([]);
  });

  it('returns 404 when creator is outside the organization', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getCreatorDashboard(managerToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('requires active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getCreatorDashboard({ ...managerToken, organizationId: undefined }, 'creator-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
