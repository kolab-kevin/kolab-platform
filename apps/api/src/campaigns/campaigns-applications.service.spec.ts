import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CampaignsService } from './campaigns.service';
import { assertAllowedApplicationStatusTransition } from './campaigns.utils';

jest.mock('@kolab/database', () => ({
  prisma: {
    campaign: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    campaignDeliverable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    campaignApplication: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  CampaignStatus: {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    ARCHIVED: 'ARCHIVED',
  },
  CampaignApplicationStatus: {
    INVITED: 'INVITED',
    APPLIED: 'APPLIED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
    CANCELLED: 'CANCELLED',
  },
  CampaignApplicationSource: {
    INVITE: 'INVITE',
    CREATOR_APPLIED: 'CREATOR_APPLIED',
    MANUAL: 'MANUAL',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    Decimal: class Decimal {
      constructor(public value: number | string) {}
      toString() {
        return String(this.value);
      }
    },
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

const activeCampaign = {
  id: 'campaign-1',
  organizationId: 'org-1',
  status: 'ACTIVE',
};

const creatorProfile = {
  id: 'creator-profile-1',
  organizationId: 'org-1',
  userId: 'creator-user-1',
};

const baseApplication = {
  id: 'application-1',
  organizationId: 'org-1',
  campaignId: 'campaign-1',
  creatorProfileId: 'creator-profile-1',
  status: 'INVITED',
  source: 'INVITE',
  message: 'Join our summer campaign',
  invitedByUserId: 'manager-1',
  appliedAt: null,
  reviewedByUserId: null,
  reviewedAt: null,
  decisionReason: null,
  metadata: {},
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-03T12:00:00.000Z'),
};

describe('Campaign applications', () => {
  let service: CampaignsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CampaignsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(activeCampaign);
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(creatorProfile);
  });

  it('invites a creator and records audit event', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.campaignApplication.create as jest.Mock).mockResolvedValue(baseApplication);

    const result = await service.inviteApplication(managerToken, 'campaign-1', {
      creatorProfileId: 'creator-profile-1',
      message: 'Join our summer campaign',
    });

    expect(result.status).toBe('INVITED');
    expect(result.invitedByUserId).toBe('manager-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_APPLICATION_INVITED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN_APPLICATION,
      }),
    );
  });

  it('creates a creator application and records audit event', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.campaignApplication.create as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'APPLIED',
      source: 'CREATOR_APPLIED',
      invitedByUserId: null,
      appliedAt: new Date('2026-07-03T12:05:00.000Z'),
    });

    const result = await service.applyToCampaign(managerToken, 'campaign-1', {
      creatorProfileId: 'creator-profile-1',
      message: 'I would love to participate',
    });

    expect(result.status).toBe('APPLIED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_APPLICATION_APPLIED,
      }),
    );
  });

  it('transitions an invite to applied when creator applies', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue(baseApplication);
    (prisma.campaignApplication.update as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'APPLIED',
      source: 'CREATOR_APPLIED',
      appliedAt: new Date('2026-07-03T12:05:00.000Z'),
    });

    const result = await service.applyToCampaign(managerToken, 'campaign-1', {
      creatorProfileId: 'creator-profile-1',
    });

    expect(result.status).toBe('APPLIED');
    expect(prisma.campaignApplication.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate active applications', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'APPLIED',
    });

    await expect(
      service.inviteApplication(managerToken, 'campaign-1', {
        creatorProfileId: 'creator-profile-1',
      }),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.applyToCampaign(managerToken, 'campaign-1', {
        creatorProfileId: 'creator-profile-1',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('accepts an application with audit logging', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock)
      .mockResolvedValueOnce({
        ...baseApplication,
        status: 'APPLIED',
        source: 'CREATOR_APPLIED',
        appliedAt: new Date('2026-07-03T12:05:00.000Z'),
      })
      .mockResolvedValueOnce({
        ...baseApplication,
        status: 'APPLIED',
        source: 'CREATOR_APPLIED',
        appliedAt: new Date('2026-07-03T12:05:00.000Z'),
      });
    (prisma.campaignApplication.update as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'ACCEPTED',
      source: 'CREATOR_APPLIED',
      reviewedByUserId: 'manager-1',
      reviewedAt: new Date('2026-07-03T13:00:00.000Z'),
    });

    const result = await service.acceptApplication(managerToken, 'campaign-1', 'application-1', {});

    expect(result.status).toBe('ACCEPTED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_APPLICATION_ACCEPTED,
      }),
    );
  });

  it('rejects an application with audit logging', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'APPLIED',
      source: 'CREATOR_APPLIED',
    });
    (prisma.campaignApplication.update as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'REJECTED',
      source: 'CREATOR_APPLIED',
      reviewedByUserId: 'manager-1',
      reviewedAt: new Date('2026-07-03T13:00:00.000Z'),
      decisionReason: 'Not a fit for this campaign',
    });

    const result = await service.rejectApplication(managerToken, 'campaign-1', 'application-1', {
      decisionReason: 'Not a fit for this campaign',
    });

    expect(result.status).toBe('REJECTED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_APPLICATION_REJECTED,
      }),
    );
  });

  it('withdraws an application with audit logging', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'APPLIED',
      source: 'CREATOR_APPLIED',
    });
    (prisma.campaignApplication.update as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'WITHDRAWN',
      source: 'CREATOR_APPLIED',
    });

    const result = await service.withdrawApplication(
      managerToken,
      'campaign-1',
      'application-1',
      {},
    );

    expect(result.status).toBe('WITHDRAWN');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_APPLICATION_WITHDRAWN,
      }),
    );
  });

  it('rejects invalid application status transitions', async () => {
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue({
      ...baseApplication,
      status: 'ACCEPTED',
    });

    await expect(
      service.withdrawApplication(managerToken, 'campaign-1', 'application-1', {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('enforces organization isolation for applications', async () => {
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.listApplications(otherOrgToken, 'campaign-1', {})).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('application status workflow helpers', () => {
  it('allows APPLIED to ACCEPTED', () => {
    expect(() => assertAllowedApplicationStatusTransition('APPLIED', 'ACCEPTED')).not.toThrow();
  });

  it('rejects ACCEPTED to WITHDRAWN', () => {
    expect(() => assertAllowedApplicationStatusTransition('ACCEPTED', 'WITHDRAWN')).toThrow(
      BadRequestException,
    );
  });
});
