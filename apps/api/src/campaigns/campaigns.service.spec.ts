import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CampaignsService } from './campaigns.service';
import { assertAllowedCampaignStatusTransition } from './campaigns.utils';

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
  CampaignDeliverableStatus: {
    DRAFT: 'DRAFT',
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
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

const baseCampaign = {
  id: 'campaign-1',
  organizationId: 'org-1',
  title: 'Summer Brand Deal',
  description: 'Creator campaign for summer launch',
  brandName: 'Acme Beauty',
  campaignType: 'BRAND_DEAL',
  status: 'DRAFT',
  budgetAmount: { toString: () => '5000.00' },
  budgetCurrency: 'USD',
  startsAt: new Date('2026-08-01T00:00:00.000Z'),
  endsAt: new Date('2026-08-31T23:59:59.000Z'),
  applicationDeadline: new Date('2026-07-15T23:59:59.000Z'),
  brief: { objective: 'Drive awareness' },
  requirements: { posts: 3 },
  metadata: {},
  createdByUserId: 'manager-1',
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-03T12:00:00.000Z'),
};

const baseDeliverable = {
  id: 'deliverable-1',
  organizationId: 'org-1',
  campaignId: 'campaign-1',
  title: 'TikTok video #1',
  description: 'Launch teaser',
  status: 'DRAFT',
  dueAt: new Date('2026-08-10T12:00:00.000Z'),
  requirements: { durationSeconds: 30 },
  metadata: {},
  createdAt: new Date('2026-07-03T12:10:00.000Z'),
  updatedAt: new Date('2026-07-03T12:10:00.000Z'),
};

describe('CampaignsService', () => {
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
  });

  it('creates, lists, gets, and updates campaigns with audit events', async () => {
    (prisma.campaign.create as jest.Mock).mockResolvedValue(baseCampaign);
    (prisma.campaign.findMany as jest.Mock).mockResolvedValue([baseCampaign]);
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(baseCampaign);
    (prisma.campaign.update as jest.Mock).mockResolvedValue({
      ...baseCampaign,
      title: 'Updated Campaign',
    });

    const created = await service.createCampaign(managerToken, {
      title: 'Summer Brand Deal',
      campaignType: 'BRAND_DEAL',
      budgetAmount: 5000,
      budgetCurrency: 'USD',
    });

    expect(created.status).toBe('DRAFT');
    expect(created.createdByUserId).toBe('manager-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_CREATED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
      }),
    );

    const listed = await service.listCampaigns(managerToken, { limit: 20 });
    expect(listed.items).toHaveLength(1);

    const detail = await service.getCampaign(managerToken, 'campaign-1');
    expect(detail.id).toBe('campaign-1');

    const updated = await service.updateCampaign(managerToken, 'campaign-1', {
      title: 'Updated Campaign',
    });
    expect(updated.title).toBe('Updated Campaign');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_UPDATED,
      }),
    );
  });

  it('updates campaign status with controlled transitions and audit logging', async () => {
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue({
      ...baseCampaign,
      status: 'DRAFT',
    });
    (prisma.campaign.update as jest.Mock).mockResolvedValue({
      ...baseCampaign,
      status: 'ACTIVE',
    });

    const result = await service.updateCampaignStatus(managerToken, 'campaign-1', {
      status: 'ACTIVE',
    });

    expect(result.status).toBe('ACTIVE');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_STATUS_CHANGED,
        metadata: expect.objectContaining({
          previousStatus: 'DRAFT',
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('rejects invalid campaign status transitions', async () => {
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue({
      ...baseCampaign,
      status: 'DRAFT',
    });

    await expect(
      service.updateCampaignStatus(managerToken, 'campaign-1', { status: 'COMPLETED' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates, lists, updates, and changes deliverable status', async () => {
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(baseCampaign);
    (prisma.campaignDeliverable.findMany as jest.Mock).mockResolvedValue([baseDeliverable]);
    (prisma.campaignDeliverable.create as jest.Mock).mockResolvedValue(baseDeliverable);
    (prisma.campaignDeliverable.findFirst as jest.Mock).mockResolvedValue(baseDeliverable);
    (prisma.campaignDeliverable.update as jest.Mock).mockResolvedValue({
      ...baseDeliverable,
      status: 'OPEN',
    });

    const created = await service.createDeliverable(managerToken, 'campaign-1', {
      title: 'TikTok video #1',
    });
    expect(created.status).toBe('DRAFT');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_DELIVERABLE_CREATED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN_DELIVERABLE,
      }),
    );

    const listed = await service.listDeliverables(managerToken, 'campaign-1');
    expect(listed.items).toHaveLength(1);

    (prisma.campaignDeliverable.update as jest.Mock).mockResolvedValue({
      ...baseDeliverable,
      title: 'TikTok video #1 revised',
    });

    const updated = await service.updateDeliverable(managerToken, 'campaign-1', 'deliverable-1', {
      title: 'TikTok video #1 revised',
    });
    expect(updated.title).toBe('TikTok video #1 revised');

    (prisma.campaignDeliverable.findFirst as jest.Mock).mockResolvedValue(baseDeliverable);
    (prisma.campaignDeliverable.update as jest.Mock).mockResolvedValue({
      ...baseDeliverable,
      status: 'OPEN',
    });

    const statusUpdated = await service.updateDeliverableStatus(
      managerToken,
      'campaign-1',
      'deliverable-1',
      { status: 'OPEN' },
    );
    expect(statusUpdated.status).toBe('OPEN');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_DELIVERABLE_STATUS_CHANGED,
      }),
    );
  });

  it('enforces organization isolation', async () => {
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getCampaign(otherOrgToken, 'campaign-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.listCampaigns(managerToken, { limit: 20 })).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('campaign status workflow helpers', () => {
  it('allows DRAFT to ACTIVE', () => {
    expect(() => assertAllowedCampaignStatusTransition('DRAFT', 'ACTIVE')).not.toThrow();
  });

  it('rejects DRAFT to COMPLETED directly', () => {
    expect(() => assertAllowedCampaignStatusTransition('DRAFT', 'COMPLETED')).toThrow(
      BadRequestException,
    );
  });
});
