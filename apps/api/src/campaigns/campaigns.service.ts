import type { AccessTokenPayload } from '@kolab/auth';
import type { Campaign as PrismaCampaign } from '@kolab/database';
import {
  CampaignApplicationSource,
  CampaignApplicationStatus,
  CampaignDeliverableStatus,
  CampaignStatus,
  MembershipStatus,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  AcceptCampaignApplicationInput,
  ApplyCampaignApplicationInput,
  Campaign,
  CampaignApplication,
  CampaignApplicationListQuery,
  CampaignDeliverable,
  CampaignListQuery,
  CreateCampaignDeliverableInput,
  CreateCampaignInput,
  InviteCampaignApplicationInput,
  ListCampaignApplicationsResponse,
  ListCampaignDeliverablesResponse,
  ListCampaignsResponse,
  RejectCampaignApplicationInput,
  UpdateCampaignDeliverableInput,
  UpdateCampaignDeliverableStatusInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
  WithdrawCampaignApplicationInput,
} from '@kolab/types';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCampaign, toCampaignApplication, toCampaignDeliverable } from './campaigns.mapper';
import {
  ACTIVE_CAMPAIGN_APPLICATION_STATUSES,
  assertAllowedApplicationStatusTransition,
  assertAllowedCampaignStatusTransition,
  assertAllowedDeliverableStatusTransition,
  assertApplicationsAllowedForCampaign,
  assertCampaignIsEditable,
  assertDeliverableIsEditable,
  assertDeliverablesAllowedForCampaign,
} from './campaigns.utils';

@Injectable()
export class CampaignsService {
  constructor(private readonly auditService: AuditService) {}

  async listCampaigns(
    user: AccessTokenPayload,
    query: CampaignListQuery,
  ): Promise<ListCampaignsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const take = query.limit + 1;

    const campaigns = await prisma.campaign.findMany({
      where: {
        organizationId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.campaignType ? { campaignType: query.campaignType } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { brandName: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = campaigns.length > query.limit;
    const page = hasMore ? campaigns.slice(0, query.limit) : campaigns;

    return {
      items: page.map(toCampaign),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getCampaign(user: AccessTokenPayload, campaignId: string): Promise<Campaign> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);

    return toCampaign(campaign);
  }

  async createCampaign(user: AccessTokenPayload, input: CreateCampaignInput): Promise<Campaign> {
    const organizationId = await this.requireActiveOrganization(user);

    const campaign = await prisma.campaign.create({
      data: {
        organizationId,
        title: input.title,
        description: input.description ?? null,
        brandName: input.brandName ?? null,
        campaignType: input.campaignType,
        status: CampaignStatus.DRAFT,
        budgetAmount:
          input.budgetAmount === undefined || input.budgetAmount === null
            ? null
            : new Prisma.Decimal(input.budgetAmount),
        budgetCurrency: input.budgetCurrency ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
        brief: (input.brief ?? {}) as Prisma.InputJsonValue,
        requirements: (input.requirements ?? {}) as Prisma.InputJsonValue,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        createdByUserId: user.sub,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_CREATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
      targetId: campaign.id,
      metadata: {
        campaignType: campaign.campaignType,
        status: campaign.status,
      },
    });

    return toCampaign(campaign);
  }

  async updateCampaign(
    user: AccessTokenPayload,
    campaignId: string,
    input: UpdateCampaignInput,
  ): Promise<Campaign> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadCampaign(organizationId, campaignId);

    assertCampaignIsEditable(existing.status as Campaign['status'], input);

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.brandName !== undefined ? { brandName: input.brandName } : {}),
        ...(input.campaignType !== undefined ? { campaignType: input.campaignType } : {}),
        ...(input.budgetAmount !== undefined
          ? {
              budgetAmount:
                input.budgetAmount === null ? null : new Prisma.Decimal(input.budgetAmount),
            }
          : {}),
        ...(input.budgetCurrency !== undefined ? { budgetCurrency: input.budgetCurrency } : {}),
        ...(input.startsAt !== undefined
          ? { startsAt: input.startsAt ? new Date(input.startsAt) : null }
          : {}),
        ...(input.endsAt !== undefined
          ? { endsAt: input.endsAt ? new Date(input.endsAt) : null }
          : {}),
        ...(input.applicationDeadline !== undefined
          ? {
              applicationDeadline: input.applicationDeadline
                ? new Date(input.applicationDeadline)
                : null,
            }
          : {}),
        ...(input.brief !== undefined ? { brief: input.brief as Prisma.InputJsonValue } : {}),
        ...(input.requirements !== undefined
          ? { requirements: input.requirements as Prisma.InputJsonValue }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
      targetId: updated.id,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return toCampaign(updated);
  }

  async updateCampaignStatus(
    user: AccessTokenPayload,
    campaignId: string,
    input: UpdateCampaignStatusInput,
  ): Promise<Campaign> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadCampaign(organizationId, campaignId);
    const currentStatus = existing.status as Campaign['status'];
    const nextStatus = input.status;

    assertAllowedCampaignStatusTransition(currentStatus, nextStatus);

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: nextStatus,
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
      targetId: updated.id,
      metadata: {
        previousStatus: currentStatus,
        status: nextStatus,
      },
    });

    return toCampaign(updated);
  }

  async listDeliverables(
    user: AccessTokenPayload,
    campaignId: string,
  ): Promise<ListCampaignDeliverablesResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadCampaign(organizationId, campaignId);

    const deliverables = await prisma.campaignDeliverable.findMany({
      where: {
        organizationId,
        campaignId,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      items: deliverables.map(toCampaignDeliverable),
    };
  }

  async createDeliverable(
    user: AccessTokenPayload,
    campaignId: string,
    input: CreateCampaignDeliverableInput,
  ): Promise<CampaignDeliverable> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);

    assertDeliverablesAllowedForCampaign(campaign.status as Campaign['status']);

    const deliverable = await prisma.campaignDeliverable.create({
      data: {
        organizationId,
        campaignId,
        title: input.title,
        description: input.description ?? null,
        status: CampaignDeliverableStatus.DRAFT,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        requirements: (input.requirements ?? {}) as Prisma.InputJsonValue,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_DELIVERABLE_CREATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_DELIVERABLE,
      targetId: deliverable.id,
      metadata: {
        campaignId,
        status: deliverable.status,
      },
    });

    return toCampaignDeliverable(deliverable);
  }

  async updateDeliverable(
    user: AccessTokenPayload,
    campaignId: string,
    deliverableId: string,
    input: UpdateCampaignDeliverableInput,
  ): Promise<CampaignDeliverable> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadCampaign(organizationId, campaignId);
    const existing = await this.loadDeliverable(organizationId, campaignId, deliverableId);

    assertDeliverableIsEditable(existing.status as CampaignDeliverable['status']);

    const updated = await prisma.campaignDeliverable.update({
      where: { id: deliverableId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
        ...(input.requirements !== undefined
          ? { requirements: input.requirements as Prisma.InputJsonValue }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_DELIVERABLE_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_DELIVERABLE,
      targetId: updated.id,
      metadata: {
        campaignId,
        updatedFields: Object.keys(input),
      },
    });

    return toCampaignDeliverable(updated);
  }

  async updateDeliverableStatus(
    user: AccessTokenPayload,
    campaignId: string,
    deliverableId: string,
    input: UpdateCampaignDeliverableStatusInput,
  ): Promise<CampaignDeliverable> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadCampaign(organizationId, campaignId);
    const existing = await this.loadDeliverable(organizationId, campaignId, deliverableId);
    const currentStatus = existing.status as CampaignDeliverable['status'];
    const nextStatus = input.status;

    assertAllowedDeliverableStatusTransition(currentStatus, nextStatus);

    const updated = await prisma.campaignDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: nextStatus,
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_DELIVERABLE_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_DELIVERABLE,
      targetId: updated.id,
      metadata: {
        campaignId,
        previousStatus: currentStatus,
        status: nextStatus,
      },
    });

    return toCampaignDeliverable(updated);
  }

  async listApplications(
    user: AccessTokenPayload,
    campaignId: string,
    query: CampaignApplicationListQuery,
  ): Promise<ListCampaignApplicationsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadCampaign(organizationId, campaignId);

    const applications = await prisma.campaignApplication.findMany({
      where: {
        organizationId,
        campaignId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.creatorProfileId ? { creatorProfileId: query.creatorProfileId } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      items: applications.map(toCampaignApplication),
    };
  }

  async inviteApplication(
    user: AccessTokenPayload,
    campaignId: string,
    input: InviteCampaignApplicationInput,
  ): Promise<CampaignApplication> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);

    assertApplicationsAllowedForCampaign(campaign.status as Campaign['status']);
    await this.loadCreatorProfile(organizationId, input.creatorProfileId);
    await this.assertNoActiveApplication(organizationId, campaignId, input.creatorProfileId);

    const application = await prisma.campaignApplication.create({
      data: {
        organizationId,
        campaignId,
        creatorProfileId: input.creatorProfileId,
        status: CampaignApplicationStatus.INVITED,
        source: CampaignApplicationSource.INVITE,
        message: input.message ?? null,
        invitedByUserId: user.sub,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_APPLICATION_INVITED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_APPLICATION,
      targetId: application.id,
      metadata: {
        campaignId,
        creatorProfileId: input.creatorProfileId,
        status: application.status,
      },
    });

    return toCampaignApplication(application);
  }

  async applyToCampaign(
    user: AccessTokenPayload,
    campaignId: string,
    input: ApplyCampaignApplicationInput,
  ): Promise<CampaignApplication> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);

    assertApplicationsAllowedForCampaign(campaign.status as Campaign['status']);
    await this.loadCreatorProfile(organizationId, input.creatorProfileId);

    const existingActive = await this.findActiveApplication(
      organizationId,
      campaignId,
      input.creatorProfileId,
    );

    if (existingActive?.status === CampaignApplicationStatus.APPLIED) {
      throw new ConflictException('An active application already exists for this creator');
    }

    if (existingActive?.status === CampaignApplicationStatus.INVITED) {
      assertAllowedApplicationStatusTransition('INVITED', 'APPLIED');

      const updated = await prisma.campaignApplication.update({
        where: { id: existingActive.id },
        data: {
          status: CampaignApplicationStatus.APPLIED,
          source: CampaignApplicationSource.CREATOR_APPLIED,
          appliedAt: new Date(),
          message: input.message ?? existingActive.message,
          ...(input.metadata !== undefined
            ? { metadata: input.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });

      await this.auditService.record({
        organizationId,
        actorUserId: user.sub,
        action: AUDIT_ACTION.CAMPAIGN_APPLICATION_APPLIED,
        targetType: AUDIT_TARGET_TYPE.CAMPAIGN_APPLICATION,
        targetId: updated.id,
        metadata: {
          campaignId,
          creatorProfileId: input.creatorProfileId,
          previousStatus: existingActive.status,
          status: updated.status,
        },
      });

      return toCampaignApplication(updated);
    }

    const application = await prisma.campaignApplication.create({
      data: {
        organizationId,
        campaignId,
        creatorProfileId: input.creatorProfileId,
        status: CampaignApplicationStatus.APPLIED,
        source: CampaignApplicationSource.CREATOR_APPLIED,
        message: input.message ?? null,
        appliedAt: new Date(),
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_APPLICATION_APPLIED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_APPLICATION,
      targetId: application.id,
      metadata: {
        campaignId,
        creatorProfileId: input.creatorProfileId,
        status: application.status,
      },
    });

    return toCampaignApplication(application);
  }

  async acceptApplication(
    user: AccessTokenPayload,
    campaignId: string,
    applicationId: string,
    input: AcceptCampaignApplicationInput,
  ): Promise<CampaignApplication> {
    return this.reviewApplication(user, campaignId, applicationId, 'ACCEPTED', input.metadata);
  }

  async rejectApplication(
    user: AccessTokenPayload,
    campaignId: string,
    applicationId: string,
    input: RejectCampaignApplicationInput,
  ): Promise<CampaignApplication> {
    return this.reviewApplication(
      user,
      campaignId,
      applicationId,
      'REJECTED',
      input.metadata,
      input.decisionReason ?? null,
    );
  }

  async withdrawApplication(
    user: AccessTokenPayload,
    campaignId: string,
    applicationId: string,
    input: WithdrawCampaignApplicationInput,
  ): Promise<CampaignApplication> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadApplication(organizationId, campaignId, applicationId);
    const currentStatus = existing.status as CampaignApplication['status'];

    assertAllowedApplicationStatusTransition(currentStatus, 'WITHDRAWN');

    const updated = await prisma.campaignApplication.update({
      where: { id: applicationId },
      data: {
        status: CampaignApplicationStatus.WITHDRAWN,
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_APPLICATION_WITHDRAWN,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_APPLICATION,
      targetId: updated.id,
      metadata: {
        campaignId,
        creatorProfileId: updated.creatorProfileId,
        previousStatus: currentStatus,
        status: updated.status,
      },
    });

    return toCampaignApplication(updated);
  }

  private async reviewApplication(
    user: AccessTokenPayload,
    campaignId: string,
    applicationId: string,
    nextStatus: 'ACCEPTED' | 'REJECTED',
    metadata?: Record<string, unknown>,
    decisionReason?: string | null,
  ): Promise<CampaignApplication> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadApplication(organizationId, campaignId, applicationId);
    const currentStatus = existing.status as CampaignApplication['status'];

    assertAllowedApplicationStatusTransition(currentStatus, nextStatus);

    const reviewedAt = new Date();
    const updated = await prisma.campaignApplication.update({
      where: { id: applicationId },
      data: {
        status:
          nextStatus === 'ACCEPTED'
            ? CampaignApplicationStatus.ACCEPTED
            : CampaignApplicationStatus.REJECTED,
        reviewedByUserId: user.sub,
        reviewedAt,
        ...(decisionReason !== undefined ? { decisionReason } : {}),
        ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action:
        nextStatus === 'ACCEPTED'
          ? AUDIT_ACTION.CAMPAIGN_APPLICATION_ACCEPTED
          : AUDIT_ACTION.CAMPAIGN_APPLICATION_REJECTED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN_APPLICATION,
      targetId: updated.id,
      metadata: {
        campaignId,
        creatorProfileId: updated.creatorProfileId,
        previousStatus: currentStatus,
        status: updated.status,
        ...(decisionReason ? { decisionReason } : {}),
      },
    });

    return toCampaignApplication(updated);
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

  private async loadCampaign(organizationId: string, campaignId: string): Promise<PrismaCampaign> {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private async loadDeliverable(organizationId: string, campaignId: string, deliverableId: string) {
    const deliverable = await prisma.campaignDeliverable.findFirst({
      where: {
        id: deliverableId,
        campaignId,
        organizationId,
      },
    });

    if (!deliverable) {
      throw new NotFoundException('Campaign deliverable not found');
    }

    return deliverable;
  }

  private async loadCreatorProfile(organizationId: string, creatorProfileId: string) {
    const creatorProfile = await prisma.creatorProfile.findFirst({
      where: {
        id: creatorProfileId,
        organizationId,
      },
    });

    if (!creatorProfile) {
      throw new NotFoundException('Creator profile not found');
    }

    return creatorProfile;
  }

  private async loadApplication(organizationId: string, campaignId: string, applicationId: string) {
    const application = await prisma.campaignApplication.findFirst({
      where: {
        id: applicationId,
        campaignId,
        organizationId,
      },
    });

    if (!application) {
      throw new NotFoundException('Campaign application not found');
    }

    return application;
  }

  private async findActiveApplication(
    organizationId: string,
    campaignId: string,
    creatorProfileId: string,
  ) {
    return prisma.campaignApplication.findFirst({
      where: {
        organizationId,
        campaignId,
        creatorProfileId,
        status: { in: [...ACTIVE_CAMPAIGN_APPLICATION_STATUSES] },
      },
    });
  }

  private async assertNoActiveApplication(
    organizationId: string,
    campaignId: string,
    creatorProfileId: string,
  ): Promise<void> {
    const existing = await this.findActiveApplication(organizationId, campaignId, creatorProfileId);

    if (existing) {
      throw new ConflictException('An active application already exists for this creator');
    }
  }
}
