import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { InvitationService } from './invitation.service';

const mockGenerateInvitationToken = jest.fn();
const mockHashInvitationToken = jest.fn();
const mockHashPassword = jest.fn();

jest.mock('@kolab/auth', () => ({
  generateInvitationToken: (...args: unknown[]) => mockGenerateInvitationToken(...args),
  hashInvitationToken: (...args: unknown[]) => mockHashInvitationToken(...args),
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  parseDurationToMs: () => 604800000,
}));

jest.mock('@kolab/database', () => ({
  prisma: {
    invitation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Role: { USER: 'USER' },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';

const inviterToken: AccessTokenPayload = {
  sub: 'admin-1',
  email: 'admin@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'ORG_ADMIN',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const pendingInvitation = {
  id: 'invite-1',
  organizationId: 'org-1',
  email: 'newuser@kolab.test',
  role: 'RECRUITER',
  tokenHash: 'hashed-token',
  expiresAt: new Date(Date.now() + 86_400_000),
  acceptedAt: null,
  invitedBy: 'admin-1',
};

describe('InvitationService', () => {
  let service: InvitationService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitationService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(InvitationService);
    jest.clearAllMocks();
    mockGenerateInvitationToken.mockReturnValue('raw-token');
    mockHashInvitationToken.mockReturnValue('hashed-token');
    mockHashPassword.mockResolvedValue('password-hash');
  });

  describe('createInvitation', () => {
    it('creates an invitation with a hashed token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.invitation.create as jest.Mock).mockResolvedValue(pendingInvitation);

      const result = await service.createInvitation(inviterToken, {
        email: 'newuser@kolab.test',
        role: 'RECRUITER',
      });

      expect(result.token).toBe('raw-token');
      expect(result.invitation.email).toBe('newuser@kolab.test');
      expect(result.invitation.status).toBe('PENDING');
      expect(prisma.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenHash: 'hashed-token',
            invitedBy: 'admin-1',
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invitation.created',
          targetType: 'invitation',
        }),
      );
    });

    it('rejects inviting an existing active member', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });

      await expect(
        service.createInvitation(inviterToken, {
          email: 'member@kolab.test',
          role: 'VIEWER',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('recreates an expired invitation for the same email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue({
        ...pendingInvitation,
        expiresAt: new Date(Date.now() - 86_400_000),
      });
      (prisma.invitation.delete as jest.Mock).mockResolvedValue({});
      (prisma.invitation.create as jest.Mock).mockResolvedValue(pendingInvitation);

      await service.createInvitation(inviterToken, {
        email: 'newuser@kolab.test',
        role: 'RECRUITER',
      });

      expect(prisma.invitation.delete).toHaveBeenCalledWith({ where: { id: 'invite-1' } });
    });

    it('requires organization context', async () => {
      await expect(
        service.createInvitation(
          { ...inviterToken, organizationId: undefined },
          { email: 'newuser@kolab.test', role: 'VIEWER' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listInvitations', () => {
    it('lists invitations for the active organization', async () => {
      (prisma.invitation.findMany as jest.Mock).mockResolvedValue([pendingInvitation]);

      const result = await service.listInvitations(inviterToken, { pendingOnly: false });

      expect(result.invitations).toHaveLength(1);
      expect(prisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
        }),
      );
    });
  });

  describe('revokeInvitation', () => {
    it('revokes a pending invitation', async () => {
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(pendingInvitation);
      (prisma.invitation.delete as jest.Mock).mockResolvedValue({});

      const result = await service.revokeInvitation(inviterToken, 'invite-1');

      expect(result).toEqual({ id: 'invite-1', revoked: true });
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invitation.revoked',
          targetId: 'invite-1',
        }),
      );
    });

    it('throws when invitation is not found', async () => {
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.revokeInvitation(inviterToken, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('acceptInvitation', () => {
    it('accepts an invitation and creates membership', async () => {
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(pendingInvitation);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user-new' });
      (prisma.organizationMembership.upsert as jest.Mock).mockResolvedValue({
        organizationId: 'org-1',
        userId: 'user-new',
        role: 'RECRUITER',
        status: 'ACTIVE',
      });
      (prisma.invitation.update as jest.Mock).mockResolvedValue({});

      const result = await service.acceptInvitation({
        token: 'raw-token',
        password: 'Password1',
      });

      expect(result.userId).toBe('user-new');
      expect(result.role).toBe('RECRUITER');
      expect(prisma.invitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invite-1' },
          data: { acceptedAt: expect.any(Date) },
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invitation.accepted',
          targetId: 'invite-1',
        }),
      );
    });

    it('rejects invalid invitation tokens', async () => {
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.acceptInvitation({ token: 'bad-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects accepting when user is already an active member', async () => {
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(pendingInvitation);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });

      await expect(service.acceptInvitation({ token: 'raw-token' })).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
