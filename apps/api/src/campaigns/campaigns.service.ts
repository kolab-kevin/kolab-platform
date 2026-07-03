import type { AccessTokenPayload } from '@kolab/auth';
import type { Campaign as PrismaCampaign } from '@kolab/database';
import {
  CampaignDeliverableStatus,
  CampaignStatus,
  MembershipStatus,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  Campaign,
  CampaignDeliverable,
  CampaignListQuery,
  CreateCampaignDeliverableInput,
  CreateCampaignInput,
  ListCampaignDeliverablesResponse,
  ListCampaignsResponse,
  UpdateCampaignDeliverableInput,
  UpdateCampaignDeliverableStatusInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCampaign, toCampaignDeliverable } from './campaigns.mapper';
import {
  assertAllowedCampaignStatusTransition,
  assertAllowedDeliverableStatusTransition,
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
}
