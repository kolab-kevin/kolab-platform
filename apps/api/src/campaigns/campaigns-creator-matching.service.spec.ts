import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CampaignsCreatorMatchingService } from './campaigns-creator-matching.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    campaign: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    creatorProfile: {
      findMany: jest.fn(),
    },
    campaignCreatorAssignment: {
      findMany: jest.fn(),
    },
    creatorDocument: {
      findMany: jest.fn(),
    },
    creatorContract: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  CreatorStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    InputJsonValue: {},
  },
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

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const baseCampaign = {
  id: 'campaign-1',
  organizationId: 'org-1',
  title: 'Summer Live Campaign',
  description: null,
  brandName: 'Brand',
  campaignType: 'LIVE_STREAM',
  status: 'ACTIVE',
  budgetAmount: null,
  budgetCurrency: null,
  startsAt: null,
  endsAt: null,
  applicationDeadline: null,
  brief: { platforms: ['TIKTOK'], contentTypes: ['live'] },
  requirements: { skills: ['makeup'], countries: ['US'], languages: ['en'] },
  metadata: {},
  createdByUserId: 'manager-1',
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};

const creatorOne = {
  id: 'creator-1',
  organizationId: 'org-1',
  displayName: 'Creator One',
  country: 'US',
  languages: ['en'],
  availability: { timezone: 'America/New_York' },
  metadata: {
    skills: {
      categories: ['beauty'],
      skills: ['makeup'],
      contentTypes: ['live'],
      languages: ['en'],
    },
    performanceScore: {
      creatorProfileId: 'creator-1',
      generatedAt: '2026-07-04T21:00:00.000Z',
      overallScore: 82,
      scoreBand: 'GOOD',
      reliabilityScore: 80,
      revenueScore: 78,
      engagementScore: 76,
      consistencyScore: 77,
      complianceScore: 92,
      campaignExecutionScore: 85,
      growthScore: 80,
      riskScore: 15,
      strengths: [],
      risks: [],
      recommendedActions: [],
      dataQualityWarnings: [],
    },
  },
  platformAccounts: [{ platform: 'TIKTOK', status: 'ACTIVE' }],
};

describe('CampaignsCreatorMatchingService', () => {
  let service: CampaignsCreatorMatchingService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsCreatorMatchingService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(CampaignsCreatorMatchingService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(baseCampaign);
    (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([creatorOne]);
    (prisma.campaignCreatorAssignment.findMany as jest.Mock).mockImplementation(async (args) => {
      if (args?.where?.campaignId === 'campaign-1') {
        return [];
      }
      return [{ creatorProfileId: 'creator-1' }];
    });
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([
      { creatorProfileId: 'creator-1' },
    ]);
    (prisma.creatorContract.findMany as jest.Mock).mockResolvedValue([
      { creatorProfileId: 'creator-1' },
    ]);
    (prisma.campaign.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...baseCampaign,
      metadata: data.metadata,
    }));
  });

  it('generates campaign creator matches, stores snapshot on campaign metadata, and audits generation', async () => {
    const result = await service.generateCampaignCreatorMatches(managerToken, 'campaign-1');

    expect(result.campaignId).toBe('campaign-1');
    expect(result.totalCandidates).toBe(1);
    expect(result.matches[0]?.creatorProfileId).toBe('creator-1');
    expect(prisma.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            creatorMatches: expect.objectContaining({ campaignId: 'campaign-1' }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_CREATOR_MATCHES_GENERATED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
        targetId: 'campaign-1',
      }),
    );
  });

  it('excludes creators already actively assigned to the campaign', async () => {
    (prisma.campaignCreatorAssignment.findMany as jest.Mock).mockImplementation(async (args) => {
      if (args?.where?.campaignId === 'campaign-1') {
        return [{ creatorProfileId: 'creator-1' }];
      }
      return [];
    });

    const result = await service.generateCampaignCreatorMatches(managerToken, 'campaign-1');

    expect(result.totalCandidates).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('replaces previous campaign creator matches snapshot on rerun', async () => {
    await service.generateCampaignCreatorMatches(managerToken, 'campaign-1');
    await service.generateCampaignCreatorMatches(managerToken, 'campaign-1');

    expect(prisma.campaign.update).toHaveBeenCalledTimes(2);
  });

  it('reads stored campaign creator matches snapshot and audits view access', async () => {
    const generated = await service.generateCampaignCreatorMatches(managerToken, 'campaign-1');

    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue({
      ...baseCampaign,
      metadata: { creatorMatches: generated },
    });

    const result = await service.getCampaignCreatorMatches(managerToken, 'campaign-1');

    expect(result.generatedAt).toBe(generated.generatedAt);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_CREATOR_MATCHES_VIEWED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
        targetId: 'campaign-1',
      }),
    );
  });

  it('throws when campaign creator matches snapshot has not been generated', async () => {
    await expect(service.getCampaignCreatorMatches(managerToken, 'campaign-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when campaign is outside the active organization', async () => {
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateCampaignCreatorMatches(otherOrgToken, 'campaign-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateCampaignCreatorMatches(managerToken, 'campaign-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('loads only active creators as match candidates', async () => {
    await service.generateCampaignCreatorMatches(managerToken, 'campaign-1');

    expect(prisma.creatorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
        }),
      }),
    );
  });
});
