import type { AccessTokenPayload } from '@kolab/auth';
import {
  CampaignApplicationStatus,
  CampaignAssignmentStatus,
  CampaignCreatorDeliverableStatus,
  MembershipStatus,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  Campaign,
  CampaignAssignmentListQuery,
  CampaignCreatorAssignment,
  CampaignCreatorDeliverable,
  CreateCampaignCreatorAssignmentInput,
  CreateCampaignCreatorDeliverableInput,
  ListCampaignCreatorAssignmentsResponse,
  ListCampaignCreatorDeliverablesResponse,
  UpdateCampaignCreatorAssignmentStatusInput,
  UpdateCampaignCreatorDeliverableInput,
  UpdateCampaignCreatorDeliverableStatusInput,
} from '@kolab/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCampaignCreatorAssignment, toCampaignCreatorDeliverable } from './campaigns.mapper';
import {
  ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES,
  assertAllowedAssignmentStatusTransition,
  assertAllowedCreatorDeliverableStatusTransition,
  assertAssignmentsAllowedForCampaign,
  assertCreatorDeliverableIsEditable,
  assertCreatorDeliverablesAllowedForAssignment,
} from './campaigns.utils';

@Injectable()
export class CampaignsAssignmentsService {
  constructor(private readonly auditService: AuditService) {}

  async listAssignments(
    user: AccessTokenPayload,
    campaignId: string,
    query: CampaignAssignmentListQuery,
  ): Promise<ListCampaignCreatorAssignmentsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadCampaign(organizationId, campaignId);

    const assignments = await prisma.campaignCreatorAssignment.findMany({
      where: {
        organizationId,
        campaignId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.creatorProfileId ? { creatorProfileId: query.creatorProfileId } : {}),
      },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
    });

    return {
      items: assignments.map(toCampaignCreatorAssignment),
    };
  }

  async getAssignment(
    user: AccessTokenPayload,
    campaignId: string,
    assignmentId: string,
  ): Promise<CampaignCreatorAssignment> {
    const organizationId = await this.requireActiveOrganization(user);
    const assignment = await this.loadAssignment(organizationId, campaignId, assignmentId);

    return toCampaignCreatorAssignment(assignment);
  }

  async createAssignment(
    user: AccessTokenPayload,
    campaignId: string,
    input: CreateCampaignCreatorAssignmentInput,
  ): Promise<CampaignCreatorAssignment> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);

    assertAssignmentsAllowedForCampaign(campaign.status as Campaign['status']);
    await this.loadCreatorProfile(organizationId, input.creatorProfileId);
    await this.assertNoActiveAssignment(organizationId, campaignId, input.creatorProfileId);

    let applicationId: string | null = null;

    if (input.applicationId) {
      const application = await this.loadApplication(
        organizationId,
        campaignId,
        input.applicationId,
      );

      if (application.status !== CampaignApplicationStatus.ACCEPTED) {
        throw new BadRequestException('Application must be accepted before creating an assignment');
      }

      if (application.creatorProfileId !== input.creatorProfileId) {
        throw new BadRequestException('Application creator does not match assignment creator');
      }

      const existingForApplication = await prisma.campaignCreatorAssignment.findUnique({
        where: { applicationId: input.applicationId },
      });

      if (existingForApplication) {
        throw new ConflictException('An assignment already exists for this application');
      }

      applicationId = application.id;
    }

    const assignment = await prisma.campaignCreatorAssignment.create({
      data: {
        organizationId,
        campaignId,
        creatorProfileId: input.creatorProfileId,
        applicationId,
        status: CampaignAssignmentStatus.ASSIGNED,
        assignedByUserId: user.sub,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_ASSIGNMENT_CREATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_CREATOR_ASSIGNMENT,
      targetId: assignment.id,
      metadata: {
        campaignId,
        creatorProfileId: input.creatorProfileId,
        applicationId,
        status: assignment.status,
      },
    });

    return toCampaignCreatorAssignment(assignment);
  }

  async updateAssignmentStatus(
    user: AccessTokenPayload,
    campaignId: string,
    assignmentId: string,
    input: UpdateCampaignCreatorAssignmentStatusInput,
  ): Promise<CampaignCreatorAssignment> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadAssignment(organizationId, campaignId, assignmentId);
    const currentStatus = existing.status as CampaignCreatorAssignment['status'];
    const nextStatus = input.status;

    assertAllowedAssignmentStatusTransition(currentStatus, nextStatus);

    const now = new Date();
    const updated = await prisma.campaignCreatorAssignment.update({
      where: { id: assignmentId },
      data: {
        status: nextStatus,
        ...(nextStatus === 'ACCEPTED' ? { acceptedAt: now } : {}),
        ...(nextStatus === 'COMPLETED' ? { completedAt: now } : {}),
        ...(nextStatus === 'CANCELLED' ? { cancelledAt: now } : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_ASSIGNMENT_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_CREATOR_ASSIGNMENT,
      targetId: updated.id,
      metadata: {
        campaignId,
        creatorProfileId: updated.creatorProfileId,
        previousStatus: currentStatus,
        status: nextStatus,
      },
    });

    return toCampaignCreatorAssignment(updated);
  }

  async listCreatorDeliverables(
    user: AccessTokenPayload,
    campaignId: string,
    assignmentId: string,
  ): Promise<ListCampaignCreatorDeliverablesResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadAssignment(organizationId, campaignId, assignmentId);

    const deliverables = await prisma.campaignCreatorDeliverable.findMany({
      where: {
        organizationId,
        assignmentId,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      items: deliverables.map(toCampaignCreatorDeliverable),
    };
  }

  async createCreatorDeliverable(
    user: AccessTokenPayload,
    campaignId: string,
    assignmentId: string,
    input: CreateCampaignCreatorDeliverableInput,
  ): Promise<CampaignCreatorDeliverable> {
    const organizationId = await this.requireActiveOrganization(user);
    const assignment = await this.loadAssignment(organizationId, campaignId, assignmentId);

    assertCreatorDeliverablesAllowedForAssignment(
      assignment.status as CampaignCreatorAssignment['status'],
    );

    const campaignDeliverable = await this.loadDeliverable(
      organizationId,
      campaignId,
      input.campaignDeliverableId,
    );

    if (campaignDeliverable.campaignId !== campaignId) {
      throw new BadRequestException('Campaign deliverable does not belong to this campaign');
    }

    const existing = await prisma.campaignCreatorDeliverable.findUnique({
      where: {
        assignmentId_campaignDeliverableId: {
          assignmentId,
          campaignDeliverableId: input.campaignDeliverableId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Creator deliverable already exists for this assignment');
    }

    const deliverable = await prisma.campaignCreatorDeliverable.create({
      data: {
        organizationId,
        assignmentId,
        campaignDeliverableId: input.campaignDeliverableId,
        status: CampaignCreatorDeliverableStatus.ASSIGNED,
        dueAt: input.dueAt ? new Date(input.dueAt) : campaignDeliverable.dueAt,
        notes: input.notes ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_CREATOR_DELIVERABLE_CREATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_CREATOR_DELIVERABLE,
      targetId: deliverable.id,
      metadata: {
        campaignId,
        assignmentId,
        campaignDeliverableId: input.campaignDeliverableId,
        status: deliverable.status,
      },
    });

    return toCampaignCreatorDeliverable(deliverable);
  }

  async updateCreatorDeliverable(
    user: AccessTokenPayload,
    campaignId: string,
    assignmentId: string,
    creatorDeliverableId: string,
    input: UpdateCampaignCreatorDeliverableInput,
  ): Promise<CampaignCreatorDeliverable> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadAssignment(organizationId, campaignId, assignmentId);
    const existing = await this.loadCreatorDeliverable(
      organizationId,
      assignmentId,
      creatorDeliverableId,
    );

    assertCreatorDeliverableIsEditable(existing.status as CampaignCreatorDeliverable['status']);

    const updated = await prisma.campaignCreatorDeliverable.update({
      where: { id: creatorDeliverableId },
      data: {
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
        ...(input.submissionUrl !== undefined ? { submissionUrl: input.submissionUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_CREATOR_DELIVERABLE_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_CREATOR_DELIVERABLE,
      targetId: updated.id,
      metadata: {
        campaignId,
        assignmentId,
        updatedFields: Object.keys(input),
      },
    });

    return toCampaignCreatorDeliverable(updated);
  }

  async updateCreatorDeliverableStatus(
    user: AccessTokenPayload,
    campaignId: string,
    assignmentId: string,
    creatorDeliverableId: string,
    input: UpdateCampaignCreatorDeliverableStatusInput,
  ): Promise<CampaignCreatorDeliverable> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadAssignment(organizationId, campaignId, assignmentId);
    const existing = await this.loadCreatorDeliverable(
      organizationId,
      assignmentId,
      creatorDeliverableId,
    );
    const currentStatus = existing.status as CampaignCreatorDeliverable['status'];
    const nextStatus = input.status;

    assertAllowedCreatorDeliverableStatusTransition(currentStatus, nextStatus);

    const now = new Date();
    const updated = await prisma.campaignCreatorDeliverable.update({
      where: { id: creatorDeliverableId },
      data: {
        status: nextStatus,
        ...(nextStatus === 'SUBMITTED' ? { submittedAt: now } : {}),
        ...(nextStatus === 'APPROVED' ? { approvedAt: now } : {}),
        ...(nextStatus === 'REJECTED'
          ? {
              rejectedAt: now,
              ...(input.rejectionReason !== undefined
                ? { rejectionReason: input.rejectionReason }
                : {}),
            }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_CREATOR_DELIVERABLE_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_CREATOR_DELIVERABLE,
      targetId: updated.id,
      metadata: {
        campaignId,
        assignmentId,
        previousStatus: currentStatus,
        status: nextStatus,
      },
    });

    return toCampaignCreatorDeliverable(updated);
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.sub,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }

    return user.organizationId;
  }

  private async loadCampaign(organizationId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private async loadCreatorProfile(organizationId: string, creatorProfileId: string) {
    const creatorProfile = await prisma.creatorProfile.findFirst({
      where: { id: creatorProfileId, organizationId },
    });

    if (!creatorProfile) {
      throw new NotFoundException('Creator profile not found');
    }

    return creatorProfile;
  }

  private async loadApplication(organizationId: string, campaignId: string, applicationId: string) {
    const application = await prisma.campaignApplication.findFirst({
      where: { id: applicationId, campaignId, organizationId },
    });

    if (!application) {
      throw new NotFoundException('Campaign application not found');
    }

    return application;
  }

  private async loadAssignment(organizationId: string, campaignId: string, assignmentId: string) {
    const assignment = await prisma.campaignCreatorAssignment.findFirst({
      where: { id: assignmentId, campaignId, organizationId },
    });

    if (!assignment) {
      throw new NotFoundException('Campaign creator assignment not found');
    }

    return assignment;
  }

  private async loadDeliverable(organizationId: string, campaignId: string, deliverableId: string) {
    const deliverable = await prisma.campaignDeliverable.findFirst({
      where: { id: deliverableId, campaignId, organizationId },
    });

    if (!deliverable) {
      throw new NotFoundException('Campaign deliverable not found');
    }

    return deliverable;
  }

  private async loadCreatorDeliverable(
    organizationId: string,
    assignmentId: string,
    creatorDeliverableId: string,
  ) {
    const deliverable = await prisma.campaignCreatorDeliverable.findFirst({
      where: { id: creatorDeliverableId, assignmentId, organizationId },
    });

    if (!deliverable) {
      throw new NotFoundException('Campaign creator deliverable not found');
    }

    return deliverable;
  }

  private async findActiveAssignment(
    organizationId: string,
    campaignId: string,
    creatorProfileId: string,
  ) {
    return prisma.campaignCreatorAssignment.findFirst({
      where: {
        organizationId,
        campaignId,
        creatorProfileId,
        status: { in: [...ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES] },
      },
    });
  }

  private async assertNoActiveAssignment(
    organizationId: string,
    campaignId: string,
    creatorProfileId: string,
  ): Promise<void> {
    const existing = await this.findActiveAssignment(organizationId, campaignId, creatorProfileId);

    if (existing) {
      throw new ConflictException('An active assignment already exists for this creator');
    }
  }
}
