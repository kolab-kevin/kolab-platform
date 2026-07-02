import type { AccessTokenPayload } from '@kolab/auth';
import {
  type CreatorLead as PrismaCreatorLead,
  type LeadNote as PrismaLeadNote,
  MembershipStatus,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  LeadNoteResponse,
  UpdateLeadFollowUpInput,
  UpdateLeadFollowUpResponse,
} from '@kolab/types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LEAD_MANAGER_ROLES } from './recruitment.constants';
import { appendFollowUpHistory } from './recruitment.followups.utils';
import { toNoteResponseMetadata } from './recruitment.notes.utils';
import type { FollowUpsQuery, ListRecruitmentLeadsResponse } from './recruitment.queries';
import { activeLeadMetadataFilter } from './recruitment.utils';

@Injectable()
export class RecruitmentFollowUpsService {
  constructor(private readonly auditService: AuditService) {}

  async listFollowUps(
    user: AccessTokenPayload,
    query: FollowUpsQuery,
  ): Promise<ListRecruitmentLeadsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const now = new Date();
    const where: Prisma.CreatorLeadWhereInput = {
      organizationId,
      assignedRecruiterId: user.sub,
      nextFollowUpAt: {
        not: null,
        ...(query.overdueOnly ? { lt: now } : {}),
        ...(query.dueBefore ? { lte: new Date(query.dueBefore) } : {}),
      },
      status: query.status ? query.status : { not: 'REJECTED' },
      ...activeLeadMetadataFilter(),
      ...(query.platform
        ? {
            platformAccounts: {
              some: {
                platform: query.platform,
              },
            },
          }
        : {}),
    };

    const take = query.limit + 1;
    const leads = await prisma.creatorLead.findMany({
      where,
      orderBy: [{ nextFollowUpAt: 'asc' }, { id: 'asc' }],
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

  async updateLeadFollowUp(
    user: AccessTokenPayload,
    leadId: string,
    input: UpdateLeadFollowUpInput,
  ): Promise<UpdateLeadFollowUpResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.findActiveLead(organizationId, leadId);

    this.assertCanUpdateFollowUp(user, existing);

    if (input.nextFollowUpAt !== null && existing.status === 'REJECTED') {
      throw new BadRequestException('Follow-ups cannot be scheduled for rejected leads');
    }

    const previousFollowUpAt = existing.nextFollowUpAt?.toISOString() ?? null;
    const nextFollowUpAt = input.nextFollowUpAt;
    const historyEntry = {
      updatedAt: new Date().toISOString(),
      updatedBy: user.sub,
      previousFollowUpAt,
      nextFollowUpAt,
      ...(input.note ? { note: input.note } : {}),
    };

    const result = await prisma.$transaction(async (tx) => {
      let createdNote: PrismaLeadNote | null = null;

      const lead = await tx.creatorLead.update({
        where: { id: existing.id },
        data: {
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
          metadata: appendFollowUpHistory(existing.metadata, historyEntry) as Prisma.InputJsonValue,
        },
      });

      if (input.note) {
        createdNote = await tx.leadNote.create({
          data: {
            organizationId,
            leadId: existing.id,
            authorId: user.sub,
            contactType: 'OTHER',
            note: input.note,
          },
        });
      }

      return { lead, createdNote };
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_FOLLOWUP_UPDATED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: existing.id,
      metadata: {
        previousFollowUpAt,
        nextFollowUpAt,
        noteAdded: Boolean(input.note),
      },
    });

    return {
      lead: this.toCreatorLead(result.lead),
      ...(result.createdNote
        ? { note: this.toLeadNoteResponse(result.createdNote, result.lead.metadata) }
        : {}),
    };
  }

  private assertCanUpdateFollowUp(user: AccessTokenPayload, lead: PrismaCreatorLead): void {
    if (user.isSystemAdmin) {
      return;
    }

    if (user.organizationRole && LEAD_MANAGER_ROLES.has(user.organizationRole)) {
      return;
    }

    if (lead.assignedRecruiterId === user.sub) {
      return;
    }

    throw new ForbiddenException('You can only update follow-ups for leads assigned to you');
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

  private toLeadSummary(lead: PrismaCreatorLead) {
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

  private toCreatorLead(lead: PrismaCreatorLead) {
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
      metadata: lead.metadata as Record<string, unknown>,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  private toLeadNoteResponse(
    note: PrismaLeadNote,
    leadMetadata: PrismaCreatorLead['metadata'],
  ): LeadNoteResponse {
    return {
      id: note.id,
      organizationId: note.organizationId,
      leadId: note.leadId,
      authorId: note.authorId,
      contactType: note.contactType,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
      metadata: toNoteResponseMetadata(leadMetadata, note.id),
    };
  }
}
