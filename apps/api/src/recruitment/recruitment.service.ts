import type { AccessTokenPayload } from '@kolab/auth';
import {
  type CreatorLead as PrismaCreatorLead,
  type LeadAssignment as PrismaLeadAssignment,
  type LeadNote as PrismaLeadNote,
  type LeadPlatformAccount as PrismaLeadPlatformAccount,
  type LeadStatusHistory as PrismaLeadStatusHistory,
  MembershipStatus,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  CreateLeadInput,
  CreatorLead,
  LeadAssignment,
  LeadNote,
  LeadPlatformAccount,
  LeadStatusHistory,
  LeadSummary,
  ReassignLeadInput,
  UpdateLeadInput,
  UpdateLeadStatusInput,
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
import { DISALLOWED_LEAD_ASSIGNEE_ROLES, LEAD_MANAGER_ROLES } from './recruitment.constants';
import { isNoteSoftDeleted } from './recruitment.notes.utils';
import type {
  DeleteLeadResponse,
  ListRecruitmentLeadsResponse,
  MyLeadsQuery,
  RecruitmentLeadListQuery,
  UnassignLeadInput,
} from './recruitment.queries';
import { isAllowedLeadStatusTransition } from './recruitment.status-transitions';
import { activeLeadMetadataFilter, buildSoftDeleteMetadata, toRecord } from './recruitment.utils';

export type RecruitmentLeadDetailResponse = {
  lead: CreatorLead;
  platformAccounts: LeadPlatformAccount[];
  currentAssignment: LeadAssignment | null;
  assignmentHistory: LeadAssignment[];
  notes: LeadNote[];
  statusHistory: LeadStatusHistory[];
};

export type LeadAssignmentActionResponse = {
  lead: CreatorLead;
  assignment: LeadAssignment;
};

export type LeadUnassignActionResponse = {
  lead: CreatorLead;
  assignment: LeadAssignment;
};

export type LeadStatusChangeResponse = {
  lead: CreatorLead;
  statusHistory: LeadStatusHistory;
};

@Injectable()
export class RecruitmentService {
  constructor(private readonly auditService: AuditService) {}

  async listLeads(
    user: AccessTokenPayload,
    query: RecruitmentLeadListQuery,
  ): Promise<ListRecruitmentLeadsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const where = this.buildListWhere(organizationId, query);
    const take = query.limit + 1;

    const leads = await prisma.creatorLead.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = leads.length > query.limit;
    const page = hasMore ? leads.slice(0, query.limit) : leads;

    return {
      items: page.map((lead) => this.toLeadSummary(lead)),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getLead(user: AccessTokenPayload, leadId: string): Promise<RecruitmentLeadDetailResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await prisma.creatorLead.findFirst({
      where: {
        id: leadId,
        organizationId,
        ...activeLeadMetadataFilter(),
      },
      include: {
        platformAccounts: { orderBy: { createdAt: 'asc' } },
        assignments: { orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }] },
        notes: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const assignmentHistory = lead.assignments.map((assignment) =>
      this.toLeadAssignment(assignment),
    );
    const currentAssignment =
      assignmentHistory.find((assignment) => assignment.unassignedAt === null) ?? null;

    return {
      lead: this.toCreatorLead(lead),
      platformAccounts: lead.platformAccounts.map((account) => this.toLeadPlatformAccount(account)),
      currentAssignment,
      assignmentHistory,
      notes: lead.notes
        .filter((note) => !isNoteSoftDeleted(lead.metadata, note.id))
        .map((note) => this.toLeadNote(note)),
      statusHistory: lead.statusHistory.map((entry) => this.toLeadStatusHistory(entry)),
    };
  }

  async createLead(user: AccessTokenPayload, input: CreateLeadInput): Promise<CreatorLead> {
    const organizationId = await this.requireActiveOrganization(user);

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.creatorLead.create({
        data: {
          organizationId,
          name: input.name,
          nickname: input.nickname ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          country: input.country ?? null,
          languages: input.languages ?? [],
          source: input.source ?? 'MANUAL',
          status: 'NEW',
          score: input.score ?? 50,
          commissionPlan: input.commissionPlan ?? 'STANDARD',
          notesSummary: input.notesSummary ?? null,
          nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null,
          ...(input.platformAccounts?.length
            ? {
                platformAccounts: {
                  create: input.platformAccounts.map((account) => ({
                    organizationId,
                    platform: account.platform,
                    username: account.username,
                    profileUrl: account.profileUrl ?? null,
                    followers: account.followers ?? null,
                    verified: account.verified ?? false,
                    status: account.status ?? 'ACTIVE',
                    metadata: (account.metadata ?? {}) as Prisma.InputJsonValue,
                  })),
                },
              }
            : {}),
        },
      });

      await tx.leadStatusHistory.create({
        data: {
          organizationId,
          leadId: created.id,
          previousStatus: null,
          newStatus: 'NEW',
          changedById: user.sub,
        },
      });

      return created;
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_CREATED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: lead.id,
      metadata: {
        name: lead.name,
        source: lead.source,
        status: lead.status,
      },
    });

    return this.toCreatorLead(lead);
  }

  async updateLead(
    user: AccessTokenPayload,
    leadId: string,
    input: UpdateLeadInput,
  ): Promise<CreatorLead> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.findActiveLead(organizationId, leadId);

    const data: Prisma.CreatorLeadUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.nickname !== undefined) {
      data.nickname = input.nickname;
    }
    if (input.email !== undefined) {
      data.email = input.email;
    }
    if (input.phone !== undefined) {
      data.phone = input.phone;
    }
    if (input.country !== undefined) {
      data.country = input.country;
    }
    if (input.languages !== undefined) {
      data.languages = input.languages;
    }
    if (input.source !== undefined) {
      data.source = input.source;
    }
    if (input.score !== undefined) {
      data.score = input.score;
    }
    if (input.commissionPlan !== undefined) {
      data.commissionPlan = input.commissionPlan;
    }
    if (input.notesSummary !== undefined) {
      data.notesSummary = input.notesSummary;
    }
    if (input.nextFollowUpAt !== undefined) {
      data.nextFollowUpAt = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
    }

    const lead = await prisma.creatorLead.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_UPDATED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: lead.id,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return this.toCreatorLead(lead);
  }

  async updateLeadStatus(
    user: AccessTokenPayload,
    leadId: string,
    input: UpdateLeadStatusInput,
  ): Promise<LeadStatusChangeResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.findActiveLead(organizationId, leadId);

    if (!isAllowedLeadStatusTransition(existing.status, input.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${existing.status} to ${input.status}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.creatorLead.update({
        where: { id: existing.id },
        data: { status: input.status },
      });

      const statusHistory = await tx.leadStatusHistory.create({
        data: {
          organizationId,
          leadId: lead.id,
          previousStatus: existing.status,
          newStatus: input.status,
          changedById: user.sub,
          reason: input.reason ?? null,
        },
      });

      return { lead, statusHistory };
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: existing.id,
      metadata: {
        previousStatus: existing.status,
        newStatus: input.status,
        reason: input.reason ?? null,
      },
    });

    return {
      lead: this.toCreatorLead(result.lead),
      statusHistory: this.toLeadStatusHistory(result.statusHistory),
    };
  }

  async deleteLead(user: AccessTokenPayload, leadId: string): Promise<DeleteLeadResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.findActiveLead(organizationId, leadId);

    await prisma.creatorLead.update({
      where: { id: existing.id },
      data: {
        metadata: buildSoftDeleteMetadata(existing.metadata, user.sub) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_DELETED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: existing.id,
      metadata: {
        name: existing.name,
      },
    });

    return {
      id: existing.id,
      deleted: true,
    };
  }

  async claimLead(user: AccessTokenPayload, leadId: string): Promise<LeadAssignmentActionResponse> {
    const organizationId = await this.requireActiveOrganization(user);

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.creatorLead.findFirst({
        where: {
          id: leadId,
          organizationId,
          ...activeLeadMetadataFilter(),
        },
      });

      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      if (lead.assignedRecruiterId === user.sub) {
        const assignment = await tx.leadAssignment.findFirst({
          where: {
            organizationId,
            leadId,
            recruiterId: user.sub,
            unassignedAt: null,
          },
          orderBy: { assignedAt: 'desc' },
        });

        if (!assignment) {
          throw new ConflictException('Lead is already claimed');
        }

        return { lead, assignment };
      }

      if (lead.assignedRecruiterId) {
        throw new ConflictException('Lead is already claimed by another recruiter');
      }

      const now = new Date();
      const updated = await tx.creatorLead.updateMany({
        where: {
          id: leadId,
          organizationId,
          assignedRecruiterId: null,
          ...activeLeadMetadataFilter(),
        },
        data: {
          assignedRecruiterId: user.sub,
          assignedAt: now,
        },
      });

      if (updated.count === 0) {
        throw new ConflictException('Lead is already claimed by another recruiter');
      }

      const assignment = await tx.leadAssignment.create({
        data: {
          organizationId,
          leadId,
          recruiterId: user.sub,
          assignedById: user.sub,
          reason: 'Claimed by recruiter',
        },
      });

      const refreshedLead = await tx.creatorLead.findUniqueOrThrow({
        where: { id: leadId },
      });

      return { lead: refreshedLead, assignment };
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_CLAIMED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: leadId,
      metadata: {
        recruiterId: user.sub,
      },
    });

    return {
      lead: this.toCreatorLead(result.lead),
      assignment: this.toLeadAssignment(result.assignment),
    };
  }

  async reassignLead(
    user: AccessTokenPayload,
    leadId: string,
    input: ReassignLeadInput,
  ): Promise<LeadAssignmentActionResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    this.assertLeadManager(user);

    await this.assertValidAssignee(organizationId, input.recruiterUserId);

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.creatorLead.findFirst({
        where: {
          id: leadId,
          organizationId,
          ...activeLeadMetadataFilter(),
        },
      });

      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      const now = new Date();

      await tx.leadAssignment.updateMany({
        where: {
          organizationId,
          leadId,
          unassignedAt: null,
        },
        data: {
          unassignedAt: now,
        },
      });

      const assignment = await tx.leadAssignment.create({
        data: {
          organizationId,
          leadId,
          recruiterId: input.recruiterUserId,
          assignedById: user.sub,
          reason: input.reason ?? 'Reassigned by manager',
        },
      });

      const updatedLead = await tx.creatorLead.update({
        where: { id: leadId },
        data: {
          assignedRecruiterId: input.recruiterUserId,
          assignedAt: now,
        },
      });

      return { lead: updatedLead, assignment };
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_REASSIGNED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: leadId,
      metadata: {
        recruiterId: input.recruiterUserId,
        reason: input.reason ?? null,
      },
    });

    return {
      lead: this.toCreatorLead(result.lead),
      assignment: this.toLeadAssignment(result.assignment),
    };
  }

  async unassignLead(
    user: AccessTokenPayload,
    leadId: string,
    input: UnassignLeadInput = {},
  ): Promise<LeadUnassignActionResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    this.assertLeadManager(user);

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.creatorLead.findFirst({
        where: {
          id: leadId,
          organizationId,
          ...activeLeadMetadataFilter(),
        },
      });

      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      if (!lead.assignedRecruiterId) {
        throw new ConflictException('Lead is not assigned');
      }

      const activeAssignment = await tx.leadAssignment.findFirst({
        where: {
          organizationId,
          leadId,
          unassignedAt: null,
        },
        orderBy: { assignedAt: 'desc' },
      });

      if (!activeAssignment) {
        throw new ConflictException('Lead is not assigned');
      }

      const now = new Date();
      const assignment = await tx.leadAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          unassignedAt: now,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      });

      const updatedLead = await tx.creatorLead.update({
        where: { id: leadId },
        data: {
          assignedRecruiterId: null,
          assignedAt: null,
        },
      });

      return { lead: updatedLead, assignment };
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_UNASSIGNED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: leadId,
      metadata: {
        previousRecruiterId: result.assignment.recruiterId,
        reason: input.reason ?? null,
      },
    });

    return {
      lead: this.toCreatorLead(result.lead),
      assignment: this.toLeadAssignment(result.assignment),
    };
  }

  async listMyLeads(
    user: AccessTokenPayload,
    query: MyLeadsQuery,
  ): Promise<ListRecruitmentLeadsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const where = this.buildMyLeadsWhere(organizationId, user.sub, query);
    const take = query.limit + 1;

    const leads = await prisma.creatorLead.findMany({
      where,
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = leads.length > query.limit;
    const page = hasMore ? leads.slice(0, query.limit) : leads;

    return {
      items: page.map((lead) => this.toLeadSummary(lead)),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  private buildMyLeadsWhere(
    organizationId: string,
    recruiterId: string,
    query: MyLeadsQuery,
  ): Prisma.CreatorLeadWhereInput {
    const where: Prisma.CreatorLeadWhereInput = {
      organizationId,
      assignedRecruiterId: recruiterId,
      ...activeLeadMetadataFilter(),
      ...(query.status ? { status: query.status } : {}),
      ...(query.platform
        ? {
            platformAccounts: {
              some: {
                platform: query.platform,
              },
            },
          }
        : {}),
      ...(query.followUpBefore
        ? {
            nextFollowUpAt: {
              lte: new Date(query.followUpBefore),
            },
          }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nickname: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        {
          platformAccounts: {
            some: {
              username: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    return where;
  }

  private assertLeadManager(user: AccessTokenPayload): void {
    if (user.isSystemAdmin) {
      return;
    }

    if (!user.organizationRole || !LEAD_MANAGER_ROLES.has(user.organizationRole)) {
      throw new ForbiddenException('Only organization managers can perform this action');
    }
  }

  private async assertValidAssignee(organizationId: string, userId: string): Promise<void> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Target user is not an active organization member');
    }

    if (DISALLOWED_LEAD_ASSIGNEE_ROLES.has(membership.role)) {
      throw new BadRequestException(`Cannot assign leads to ${membership.role} members`);
    }
  }

  private buildListWhere(
    organizationId: string,
    query: RecruitmentLeadListQuery,
  ): Prisma.CreatorLeadWhereInput {
    const where: Prisma.CreatorLeadWhereInput = {
      organizationId,
      ...activeLeadMetadataFilter(),
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.recruiterId ? { assignedRecruiterId: query.recruiterId } : {}),
      ...(query.platform
        ? {
            platformAccounts: {
              some: {
                platform: query.platform,
              },
            },
          }
        : {}),
      ...(query.scoreMin !== undefined || query.scoreMax !== undefined
        ? {
            score: {
              ...(query.scoreMin !== undefined ? { gte: query.scoreMin } : {}),
              ...(query.scoreMax !== undefined ? { lte: query.scoreMax } : {}),
            },
          }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nickname: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        {
          platformAccounts: {
            some: {
              username: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    return where;
  }

  private async findActiveLead(organizationId: string, leadId: string): Promise<PrismaCreatorLead> {
    const lead = await prisma.creatorLead.findFirst({
      where: {
        id: leadId,
        organizationId,
        ...activeLeadMetadataFilter(),
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    const organizationId = this.requireOrganizationContext(user);
    await this.assertActiveMembership(user.sub, organizationId);
    return organizationId;
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private async assertActiveMembership(userId: string, organizationId: string): Promise<void> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }
  }

  private toLeadSummary(lead: PrismaCreatorLead): LeadSummary {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      name: lead.name,
      nickname: lead.nickname,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      assignedRecruiterId: lead.assignedRecruiterId,
      assignedAt: lead.assignedAt?.toISOString() ?? null,
      nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
      commissionPlan: lead.commissionPlan,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  private toCreatorLead(lead: PrismaCreatorLead): CreatorLead {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      name: lead.name,
      nickname: lead.nickname,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      languages: lead.languages,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      assignedRecruiterId: lead.assignedRecruiterId,
      assignedAt: lead.assignedAt?.toISOString() ?? null,
      nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
      commissionPlan: lead.commissionPlan,
      convertedUserId: lead.convertedUserId,
      convertedAt: lead.convertedAt?.toISOString() ?? null,
      notesSummary: lead.notesSummary,
      metadata: toRecord(lead.metadata),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  private toLeadPlatformAccount(account: PrismaLeadPlatformAccount): LeadPlatformAccount {
    return {
      id: account.id,
      organizationId: account.organizationId,
      leadId: account.leadId,
      platform: account.platform,
      username: account.username,
      profileUrl: account.profileUrl,
      followers: account.followers,
      verified: account.verified,
      status: account.status,
      metadata: toRecord(account.metadata),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  private toLeadAssignment(assignment: PrismaLeadAssignment): LeadAssignment {
    return {
      id: assignment.id,
      organizationId: assignment.organizationId,
      leadId: assignment.leadId,
      recruiterId: assignment.recruiterId,
      assignedById: assignment.assignedById,
      assignedAt: assignment.assignedAt.toISOString(),
      unassignedAt: assignment.unassignedAt?.toISOString() ?? null,
      reason: assignment.reason,
      createdAt: assignment.createdAt.toISOString(),
    };
  }

  private toLeadNote(note: PrismaLeadNote): LeadNote {
    return {
      id: note.id,
      organizationId: note.organizationId,
      leadId: note.leadId,
      authorId: note.authorId,
      contactType: note.contactType,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
    };
  }

  private toLeadStatusHistory(entry: PrismaLeadStatusHistory): LeadStatusHistory {
    return {
      id: entry.id,
      organizationId: entry.organizationId,
      leadId: entry.leadId,
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      changedById: entry.changedById,
      changedAt: entry.changedAt.toISOString(),
      reason: entry.reason,
    };
  }
}
