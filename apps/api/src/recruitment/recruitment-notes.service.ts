import type { AccessTokenPayload } from '@kolab/auth';
import {
  type CreatorLead as PrismaCreatorLead,
  type LeadNote as PrismaLeadNote,
  MembershipStatus,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  AddLeadNoteInput,
  DeleteLeadNoteResponse,
  LeadNoteResponse,
  LeadTimelineEvent,
  ListLeadNotesResponse,
  ListLeadTimelineResponse,
  UpdateLeadNoteInput,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LEAD_MANAGER_ROLES } from './recruitment.constants';
import { getFollowUpHistory } from './recruitment.followups.utils';
import {
  appendNoteEditHistory,
  buildNoteSoftDeleteMetadata,
  isNoteSoftDeleted,
  toNoteResponseMetadata,
} from './recruitment.notes.utils';
import { activeLeadMetadataFilter } from './recruitment.utils';

@Injectable()
export class RecruitmentNotesService {
  constructor(private readonly auditService: AuditService) {}

  async listLeadNotes(user: AccessTokenPayload, leadId: string): Promise<ListLeadNotesResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findActiveLead(organizationId, leadId);

    const notes = await prisma.leadNote.findMany({
      where: { organizationId, leadId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: notes
        .filter((note) => !isNoteSoftDeleted(lead.metadata, note.id))
        .map((note) => this.toLeadNoteResponse(note, lead.metadata)),
    };
  }

  async addLeadNote(
    user: AccessTokenPayload,
    leadId: string,
    input: AddLeadNoteInput,
  ): Promise<LeadNoteResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.findActiveLead(organizationId, leadId);

    const note = await prisma.leadNote.create({
      data: {
        organizationId,
        leadId,
        authorId: user.sub,
        contactType: input.contactType,
        note: input.note,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_NOTE_ADDED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: leadId,
      metadata: {
        noteId: note.id,
        contactType: note.contactType,
      },
    });

    const lead = await prisma.creatorLead.findUniqueOrThrow({ where: { id: leadId } });

    return this.toLeadNoteResponse(note, lead.metadata);
  }

  async updateLeadNote(
    user: AccessTokenPayload,
    leadId: string,
    noteId: string,
    input: UpdateLeadNoteInput,
  ): Promise<LeadNoteResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findActiveLead(organizationId, leadId);
    const existing = await this.findActiveNote(organizationId, leadId, noteId, lead.metadata);

    this.assertCanEditNote(user, existing);

    const result = await prisma.$transaction(async (tx) => {
      const updatedNote = await tx.leadNote.update({
        where: { id: existing.id },
        data: {
          ...(input.contactType !== undefined ? { contactType: input.contactType } : {}),
          ...(input.note !== undefined ? { note: input.note } : {}),
        },
      });

      const nextMetadata = appendNoteEditHistory(lead.metadata, noteId, {
        editedAt: new Date().toISOString(),
        editedBy: user.sub,
        ...(input.contactType !== undefined ? { previousContactType: existing.contactType } : {}),
        ...(input.note !== undefined ? { previousNote: existing.note } : {}),
      });

      await tx.creatorLead.update({
        where: { id: leadId },
        data: {
          metadata: nextMetadata as Prisma.InputJsonValue,
        },
      });

      return updatedNote;
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_NOTE_UPDATED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: leadId,
      metadata: {
        noteId,
        updatedFields: Object.keys(input),
      },
    });

    const refreshedLead = await prisma.creatorLead.findUniqueOrThrow({ where: { id: leadId } });

    return this.toLeadNoteResponse(result, refreshedLead.metadata);
  }

  async deleteLeadNote(
    user: AccessTokenPayload,
    leadId: string,
    noteId: string,
  ): Promise<DeleteLeadNoteResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findActiveLead(organizationId, leadId);
    const existing = await this.findActiveNote(organizationId, leadId, noteId, lead.metadata);

    this.assertCanDeleteNote(user, existing);

    await prisma.creatorLead.update({
      where: { id: leadId },
      data: {
        metadata: buildNoteSoftDeleteMetadata(
          lead.metadata,
          noteId,
          user.sub,
        ) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_NOTE_DELETED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: leadId,
      metadata: {
        noteId,
      },
    });

    return {
      id: existing.id,
      deleted: true,
    };
  }

  async getLeadTimeline(
    user: AccessTokenPayload,
    leadId: string,
  ): Promise<ListLeadTimelineResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findActiveLead(organizationId, leadId);

    const [assignments, statusHistory, notes] = await Promise.all([
      prisma.leadAssignment.findMany({
        where: { organizationId, leadId },
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.leadStatusHistory.findMany({
        where: { organizationId, leadId },
        orderBy: { changedAt: 'desc' },
      }),
      prisma.leadNote.findMany({
        where: { organizationId, leadId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const events: LeadTimelineEvent[] = [
      {
        id: `lead-created-${lead.id}`,
        type: 'lead.created',
        occurredAt: lead.createdAt.toISOString(),
        actorUserId:
          statusHistory.find((entry) => entry.previousStatus === null)?.changedById ?? null,
        data: {
          leadId: lead.id,
          name: lead.name,
          status: lead.status,
        },
      },
    ];

    for (const assignment of assignments) {
      events.push({
        id: `assignment-started-${assignment.id}`,
        type: 'assignment.started',
        occurredAt: assignment.assignedAt.toISOString(),
        actorUserId: assignment.assignedById,
        data: {
          assignmentId: assignment.id,
          recruiterId: assignment.recruiterId,
          reason: assignment.reason,
        },
      });

      if (assignment.unassignedAt) {
        events.push({
          id: `assignment-ended-${assignment.id}`,
          type: 'assignment.ended',
          occurredAt: assignment.unassignedAt.toISOString(),
          actorUserId: assignment.assignedById,
          data: {
            assignmentId: assignment.id,
            recruiterId: assignment.recruiterId,
            reason: assignment.reason,
          },
        });
      }
    }

    for (const entry of statusHistory) {
      events.push({
        id: `status-changed-${entry.id}`,
        type: 'status.changed',
        occurredAt: entry.changedAt.toISOString(),
        actorUserId: entry.changedById,
        data: {
          previousStatus: entry.previousStatus,
          newStatus: entry.newStatus,
          reason: entry.reason,
        },
      });
    }

    for (const note of notes) {
      if (isNoteSoftDeleted(lead.metadata, note.id)) {
        continue;
      }

      events.push({
        id: `note-added-${note.id}`,
        type: 'note.added',
        occurredAt: note.createdAt.toISOString(),
        actorUserId: note.authorId,
        data: {
          noteId: note.id,
          contactType: note.contactType,
          note: note.note,
        },
      });
    }

    for (const [index, entry] of getFollowUpHistory(lead.metadata).entries()) {
      events.push({
        id: `followup-updated-${lead.id}-${index}-${entry.updatedAt}`,
        type: 'followup.updated',
        occurredAt: entry.updatedAt,
        actorUserId: entry.updatedBy,
        data: {
          previousFollowUpAt: entry.previousFollowUpAt,
          nextFollowUpAt: entry.nextFollowUpAt,
          ...(entry.note ? { note: entry.note } : {}),
        },
      });
    }

    events.sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );

    return { items: events };
  }

  private async findActiveNote(
    organizationId: string,
    leadId: string,
    noteId: string,
    leadMetadata: PrismaCreatorLead['metadata'],
  ): Promise<PrismaLeadNote> {
    const note = await prisma.leadNote.findFirst({
      where: {
        id: noteId,
        organizationId,
        leadId,
      },
    });

    if (!note || isNoteSoftDeleted(leadMetadata, note.id)) {
      throw new NotFoundException('Lead note not found');
    }

    return note;
  }

  private assertCanEditNote(user: AccessTokenPayload, note: PrismaLeadNote): void {
    if (this.isLeadManager(user) || note.authorId === user.sub) {
      return;
    }

    throw new ForbiddenException('Only the note author or a manager can edit this note');
  }

  private assertCanDeleteNote(user: AccessTokenPayload, note: PrismaLeadNote): void {
    if (this.isLeadManager(user) || note.authorId === user.sub) {
      return;
    }

    throw new ForbiddenException('Only the note author or a manager can delete this note');
  }

  private isLeadManager(user: AccessTokenPayload): boolean {
    if (user.isSystemAdmin) {
      return true;
    }

    return Boolean(user.organizationRole && LEAD_MANAGER_ROLES.has(user.organizationRole));
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
