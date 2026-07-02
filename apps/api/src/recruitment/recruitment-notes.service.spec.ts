import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { RecruitmentNotesService } from './recruitment-notes.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorLead: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    leadNote: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    leadAssignment: {
      findMany: jest.fn(),
    },
    leadStatusHistory: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
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

const recruiterToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'recruiter-1',
  email: 'recruiter@kolab.test',
  organizationRole: 'RECRUITER',
};

const otherRecruiterToken: AccessTokenPayload = {
  ...recruiterToken,
  sub: 'recruiter-2',
};

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const baseLead = {
  id: 'lead-1',
  organizationId: 'org-1',
  name: 'Jane Creator',
  status: 'NEW',
  metadata: {},
  createdAt: new Date('2026-06-20T08:00:00.000Z'),
};

const baseNote = {
  id: 'note-1',
  organizationId: 'org-1',
  leadId: 'lead-1',
  authorId: 'recruiter-1',
  contactType: 'CALL',
  note: 'Discussed onboarding timeline',
  createdAt: new Date('2026-06-21T10:00:00.000Z'),
};

describe('RecruitmentNotesService', () => {
  let service: RecruitmentNotesService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecruitmentNotesService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(RecruitmentNotesService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);
    (prisma.creatorLead.findUniqueOrThrow as jest.Mock).mockResolvedValue(baseLead);
  });

  describe('addLeadNote', () => {
    it('creates a note and records audit', async () => {
      (prisma.leadNote.create as jest.Mock).mockResolvedValue(baseNote);

      const result = await service.addLeadNote(recruiterToken, 'lead-1', {
        contactType: 'CALL',
        note: 'Discussed onboarding timeline',
      });

      expect(result.note).toBe('Discussed onboarding timeline');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_NOTE_ADDED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
        }),
      );
    });
  });

  describe('listLeadNotes', () => {
    it('hides soft-deleted notes', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        metadata: {
          noteRecords: {
            'note-2': { deleted: true },
          },
        },
      });
      (prisma.leadNote.findMany as jest.Mock).mockResolvedValue([
        baseNote,
        { ...baseNote, id: 'note-2', note: 'Hidden note' },
      ]);

      const result = await service.listLeadNotes(managerToken, 'lead-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe('note-1');
    });
  });

  describe('updateLeadNote', () => {
    it('allows authors to edit their own notes', async () => {
      (prisma.leadNote.findFirst as jest.Mock).mockResolvedValue(baseNote);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          leadNote: {
            update: jest.fn().mockResolvedValue({ ...baseNote, note: 'Updated note' }),
          },
          creatorLead: {
            update: jest.fn().mockResolvedValue({}),
          },
        }),
      );
      (prisma.creatorLead.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        ...baseLead,
        metadata: {
          noteRecords: {
            'note-1': {
              editHistory: [
                {
                  editedAt: '2026-06-21T11:00:00.000Z',
                  editedBy: 'recruiter-1',
                  previousNote: 'Discussed onboarding timeline',
                },
              ],
            },
          },
        },
      });

      const result = await service.updateLeadNote(recruiterToken, 'lead-1', 'note-1', {
        note: 'Updated note',
      });

      expect(result.note).toBe('Updated note');
      expect(result.metadata.editHistory).toHaveLength(1);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_NOTE_UPDATED,
        }),
      );
    });

    it('allows managers to edit another user note', async () => {
      (prisma.leadNote.findFirst as jest.Mock).mockResolvedValue(baseNote);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          leadNote: {
            update: jest.fn().mockResolvedValue({ ...baseNote, note: 'Manager edit' }),
          },
          creatorLead: {
            update: jest.fn().mockResolvedValue({}),
          },
        }),
      );

      await service.updateLeadNote(managerToken, 'lead-1', 'note-1', {
        note: 'Manager edit',
      });

      expect(auditService.record).toHaveBeenCalled();
    });

    it('denies recruiters from editing others notes', async () => {
      (prisma.leadNote.findFirst as jest.Mock).mockResolvedValue(baseNote);

      await expect(
        service.updateLeadNote(otherRecruiterToken, 'lead-1', 'note-1', {
          note: 'Not allowed',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteLeadNote', () => {
    it('allows authors to delete their own notes', async () => {
      (prisma.leadNote.findFirst as jest.Mock).mockResolvedValue(baseNote);
      (prisma.creatorLead.update as jest.Mock).mockResolvedValue({});

      const result = await service.deleteLeadNote(recruiterToken, 'lead-1', 'note-1');

      expect(result).toEqual({ id: 'note-1', deleted: true });
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_NOTE_DELETED,
        }),
      );
    });

    it('allows managers to delete any note', async () => {
      (prisma.leadNote.findFirst as jest.Mock).mockResolvedValue(baseNote);
      (prisma.creatorLead.update as jest.Mock).mockResolvedValue({});

      await service.deleteLeadNote(managerToken, 'lead-1', 'note-1');

      expect(auditService.record).toHaveBeenCalled();
    });

    it('denies recruiters from deleting others notes', async () => {
      (prisma.leadNote.findFirst as jest.Mock).mockResolvedValue(baseNote);

      await expect(service.deleteLeadNote(otherRecruiterToken, 'lead-1', 'note-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getLeadTimeline', () => {
    it('returns newest-first combined timeline events', async () => {
      (prisma.leadAssignment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'assignment-1',
          assignedById: 'manager-1',
          recruiterId: 'recruiter-1',
          assignedAt: new Date('2026-06-21T09:00:00.000Z'),
          unassignedAt: null,
          reason: null,
        },
      ]);
      (prisma.leadStatusHistory.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'status-1',
          previousStatus: null,
          newStatus: 'NEW',
          changedById: 'manager-1',
          changedAt: new Date('2026-06-20T08:00:00.000Z'),
          reason: null,
        },
      ]);
      (prisma.leadNote.findMany as jest.Mock).mockResolvedValue([baseNote]);

      const result = await service.getLeadTimeline(managerToken, 'lead-1');

      expect(result.items[0]?.type).toBe('note.added');
      expect(result.items.map((event) => event.type)).toEqual(
        expect.arrayContaining([
          'lead.created',
          'assignment.started',
          'status.changed',
          'note.added',
        ]),
      );
    });

    it('includes creator.converted events from conversion history', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        metadata: {
          conversionHistory: [
            {
              convertedAt: '2026-06-28T12:00:00.000Z',
              convertedBy: 'manager-1',
              creatorId: 'creator-1',
              userId: 'user-1',
            },
          ],
        },
      });
      (prisma.leadAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.leadStatusHistory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.leadNote.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getLeadTimeline(managerToken, 'lead-1');

      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'creator.converted',
            data: expect.objectContaining({
              creatorId: 'creator-1',
              userId: 'user-1',
            }),
          }),
        ]),
      );
    });
  });

  describe('organization isolation', () => {
    it('scopes note listing to the active organization', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.listLeadNotes(otherOrgToken, 'lead-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
