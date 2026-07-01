import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from './audit.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';

const userToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'admin@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'ORG_ADMIN',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const auditLogRecord = {
  id: 'audit-1',
  organizationId: 'org-1',
  actorUserId: 'user-1',
  action: 'invitation.created',
  targetType: 'invitation',
  targetId: 'invite-1',
  metadata: { email: 'new@kolab.test', role: 'RECRUITER' },
  createdAt: new Date('2026-06-28T10:00:00.000Z'),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get(AuditService);
    jest.clearAllMocks();
  });

  describe('record', () => {
    it('persists audit log with required fields and sanitized metadata', async () => {
      (prisma.auditLog.create as jest.Mock).mockResolvedValue(auditLogRecord);

      const result = await service.record({
        organizationId: 'org-1',
        actorUserId: 'user-1',
        action: 'invitation.created',
        targetType: 'invitation',
        targetId: 'invite-1',
        metadata: {
          email: 'new@kolab.test',
          role: 'RECRUITER',
          token: 'raw-token-should-not-be-stored',
        },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          actorUserId: 'user-1',
          action: 'invitation.created',
          targetType: 'invitation',
          targetId: 'invite-1',
          metadata: {
            email: 'new@kolab.test',
            role: 'RECRUITER',
          },
        },
      });
      expect(result.metadata).not.toHaveProperty('token');
      expect(result.targetType).toBe('invitation');
    });
  });

  describe('listAuditLogs', () => {
    it('returns paginated audit logs for the active organization', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([auditLogRecord]);

      const result = await service.listAuditLogs(userToken, { limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
          take: 21,
        }),
      );
    });

    it('applies filters and returns next cursor when more results exist', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
        { ...auditLogRecord, id: 'audit-2' },
        { ...auditLogRecord, id: 'audit-1' },
      ]);

      const result = await service.listAuditLogs(userToken, {
        limit: 1,
        action: 'invitation.created',
        actorUserId: 'user-1',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-30T23:59:59.999Z',
        cursor: 'audit-3',
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('audit-2');
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-1',
            action: 'invitation.created',
            actorUserId: 'user-1',
            createdAt: {
              gte: new Date('2026-06-01T00:00:00.000Z'),
              lte: new Date('2026-06-30T23:59:59.999Z'),
            },
          },
          cursor: { id: 'audit-3' },
          skip: 1,
        }),
      );
    });

    it('requires active organization context', async () => {
      await expect(
        service.listAuditLogs({ ...userToken, organizationId: undefined }, { limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
