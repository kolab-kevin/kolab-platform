import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { assertAllowedAssignmentStatusTransition } from './campaigns.utils';
import { CampaignsAssignmentsService } from './campaigns-assignments.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    campaign: { findFirst: jest.fn() },
    campaignApplication: { findFirst: jest.fn() },
    campaignDeliverable: { findFirst: jest.fn() },
    campaignCreatorAssignment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    campaignCreatorDeliverable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creatorProfile: { findFirst: jest.fn() },
    organizationMembership: { findUnique: jest.fn() },
  },
  CampaignApplicationStatus: {
    ACCEPTED: 'ACCEPTED',
    APPLIED: 'APPLIED',
  },
  CampaignAssignmentStatus: {
    ASSIGNED: 'ASSIGNED',
    ACCEPTED: 'ACCEPTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
  CampaignCreatorDeliverableStatus: {
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE' },
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
  organizationId: 'org-2',
};

const activeCampaign = { id: 'campaign-1', organizationId: 'org-1', status: 'ACTIVE' };
const creatorProfile = { id: 'creator-profile-1', organizationId: 'org-1' };
const acceptedApplication = {
  id: 'application-1',
  organizationId: 'org-1',
  campaignId: 'campaign-1',
  creatorProfileId: 'creator-profile-1',
  status: 'ACCEPTED',
};

const baseAssignment = {
  id: 'assignment-1',
  organizationId: 'org-1',
  campaignId: 'campaign-1',
  creatorProfileId: 'creator-profile-1',
  applicationId: 'application-1',
  status: 'ASSIGNED',
  assignedByUserId: 'manager-1',
  assignedAt: new Date('2026-07-03T14:00:00.000Z'),
  acceptedAt: null,
  completedAt: null,
  cancelledAt: null,
  metadata: {},
  createdAt: new Date('2026-07-03T14:00:00.000Z'),
  updatedAt: new Date('2026-07-03T14:00:00.000Z'),
};

const campaignDeliverable = {
  id: 'campaign-deliverable-1',
  organizationId: 'org-1',
  campaignId: 'campaign-1',
  dueAt: new Date('2026-08-10T12:00:00.000Z'),
};

const baseCreatorDeliverable = {
  id: 'creator-deliverable-1',
  organizationId: 'org-1',
  assignmentId: 'assignment-1',
  campaignDeliverableId: 'campaign-deliverable-1',
  status: 'ASSIGNED',
  dueAt: new Date('2026-08-10T12:00:00.000Z'),
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  submissionUrl: null,
  notes: null,
  metadata: {},
  createdAt: new Date('2026-07-03T14:10:00.000Z'),
  updatedAt: new Date('2026-07-03T14:10:00.000Z'),
};

describe('CampaignsAssignmentsService', () => {
  let service: CampaignsAssignmentsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignsAssignmentsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CampaignsAssignmentsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({ status: 'ACTIVE' });
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(activeCampaign);
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(creatorProfile);
  });

  it('creates assignment from accepted application with audit logging', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue(acceptedApplication);
    (prisma.campaignCreatorAssignment.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.campaignCreatorAssignment.create as jest.Mock).mockResolvedValue(baseAssignment);

    const result = await service.createAssignment(managerToken, 'campaign-1', {
      creatorProfileId: 'creator-profile-1',
      applicationId: 'application-1',
    });

    expect(result.applicationId).toBe('application-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_ASSIGNMENT_CREATED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN_CREATOR_ASSIGNMENT,
      }),
    );
  });

  it('creates manual assignment without application', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.campaignCreatorAssignment.create as jest.Mock).mockResolvedValue({
      ...baseAssignment,
      applicationId: null,
    });

    const result = await service.createAssignment(managerToken, 'campaign-1', {
      creatorProfileId: 'creator-profile-1',
    });

    expect(result.applicationId).toBeNull();
  });

  it('rejects duplicate active assignments', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(baseAssignment);

    await expect(
      service.createAssignment(managerToken, 'campaign-1', {
        creatorProfileId: 'creator-profile-1',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects assignment from non-accepted application', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.campaignApplication.findFirst as jest.Mock).mockResolvedValue({
      ...acceptedApplication,
      status: 'APPLIED',
    });

    await expect(
      service.createAssignment(managerToken, 'campaign-1', {
        creatorProfileId: 'creator-profile-1',
        applicationId: 'application-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates assignment status with audit logging', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(baseAssignment);
    (prisma.campaignCreatorAssignment.update as jest.Mock).mockResolvedValue({
      ...baseAssignment,
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-07-03T15:00:00.000Z'),
    });

    const result = await service.updateAssignmentStatus(
      managerToken,
      'campaign-1',
      'assignment-1',
      {
        status: 'ACCEPTED',
      },
    );

    expect(result.status).toBe('ACCEPTED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_ASSIGNMENT_STATUS_CHANGED,
      }),
    );
  });

  it('rejects invalid assignment status transitions', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue({
      ...baseAssignment,
      status: 'ASSIGNED',
    });

    await expect(
      service.updateAssignmentStatus(managerToken, 'campaign-1', 'assignment-1', {
        status: 'COMPLETED',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates, updates, and changes creator deliverable status', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(baseAssignment);
    (prisma.campaignDeliverable.findFirst as jest.Mock).mockResolvedValue(campaignDeliverable);
    (prisma.campaignCreatorDeliverable.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.campaignCreatorDeliverable.create as jest.Mock).mockResolvedValue(
      baseCreatorDeliverable,
    );
    (prisma.campaignCreatorDeliverable.findFirst as jest.Mock).mockResolvedValue(
      baseCreatorDeliverable,
    );
    (prisma.campaignCreatorDeliverable.update as jest.Mock).mockResolvedValue({
      ...baseCreatorDeliverable,
      notes: 'Updated notes',
    });

    const created = await service.createCreatorDeliverable(
      managerToken,
      'campaign-1',
      'assignment-1',
      { campaignDeliverableId: 'campaign-deliverable-1' },
    );
    expect(created.status).toBe('ASSIGNED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_CREATOR_DELIVERABLE_CREATED,
      }),
    );

    const updated = await service.updateCreatorDeliverable(
      managerToken,
      'campaign-1',
      'assignment-1',
      'creator-deliverable-1',
      { notes: 'Updated notes' },
    );
    expect(updated.notes).toBe('Updated notes');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_CREATOR_DELIVERABLE_UPDATED,
      }),
    );

    (prisma.campaignCreatorDeliverable.findFirst as jest.Mock).mockResolvedValue({
      ...baseCreatorDeliverable,
      status: 'IN_PROGRESS',
    });
    (prisma.campaignCreatorDeliverable.update as jest.Mock).mockResolvedValue({
      ...baseCreatorDeliverable,
      status: 'SUBMITTED',
      submittedAt: new Date('2026-07-03T16:00:00.000Z'),
    });

    const statusUpdated = await service.updateCreatorDeliverableStatus(
      managerToken,
      'campaign-1',
      'assignment-1',
      'creator-deliverable-1',
      { status: 'SUBMITTED' },
    );
    expect(statusUpdated.status).toBe('SUBMITTED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CAMPAIGN_CREATOR_DELIVERABLE_STATUS_CHANGED,
      }),
    );
  });

  it('enforces organization isolation', async () => {
    (prisma.campaignCreatorAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getAssignment(otherOrgToken, 'campaign-1', 'assignment-1'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('assignment status workflow helpers', () => {
  it('allows ASSIGNED to ACCEPTED', () => {
    expect(() => assertAllowedAssignmentStatusTransition('ASSIGNED', 'ACCEPTED')).not.toThrow();
  });

  it('rejects COMPLETED to ASSIGNED', () => {
    expect(() => assertAllowedAssignmentStatusTransition('COMPLETED', 'ASSIGNED')).toThrow(
      BadRequestException,
    );
  });
});
