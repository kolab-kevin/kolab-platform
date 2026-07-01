import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { ProfileService } from './profile.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
  },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';
import { UpdateProfileSchema } from '@kolab/types';

const userToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'user@kolab.test',
  role: 'USER',
  organizationId: 'org-1',
  organizationRole: 'VIEWER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const userAccount = {
  id: 'user-1',
  email: 'user@kolab.test',
  passwordHash: 'secret-hash',
  role: 'USER',
  platforms: [],
  isSystemAdmin: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  profile: {
    userId: 'user-1',
    displayName: 'Dev User',
    avatarUrl: 'https://cdn.example.com/avatar.png',
    bio: 'Hello',
    language: 'en',
    timezone: 'UTC',
    country: 'US',
  },
};

describe('ProfileService', () => {
  let service: ProfileService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(ProfileService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns user account info and profile fields', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userAccount);

      const result = await service.getProfile(userToken);

      expect(result.user.id).toBe('user-1');
      expect(result.profile.displayName).toBe('Dev User');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('returns default profile fields when profile row is missing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...userAccount,
        profile: null,
      });

      const result = await service.getProfile(userToken);

      expect(result.profile).toEqual({
        displayName: null,
        avatarUrl: null,
        bio: null,
        language: 'en',
        timezone: 'UTC',
        country: null,
      });
    });

    it('only loads the authenticated user account', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userAccount);

      await service.getProfile(userToken);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { profile: true },
      });
    });

    it('never returns passwordHash in the response payload', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userAccount);

      const result = await service.getProfile(userToken);

      expect(JSON.stringify(result)).not.toContain('passwordHash');
      expect(JSON.stringify(result)).not.toContain('secret-hash');
    });
  });

  describe('updateProfile', () => {
    it('updates profile fields for the authenticated user', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(userAccount)
        .mockResolvedValueOnce({
          ...userAccount,
          profile: {
            ...userAccount.profile,
            displayName: 'Updated Name',
          },
        });
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue({
        ...userAccount.profile,
        displayName: 'Updated Name',
      });

      const result = await service.updateProfile(userToken, { displayName: 'Updated Name' });

      expect(result.profile.displayName).toBe('Updated Name');
      expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          update: { displayName: 'Updated Name' },
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'profile.updated',
          targetType: 'profile',
          targetId: 'user-1',
        }),
      );
    });

    it('auto-creates profile when missing', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ ...userAccount, profile: null })
        .mockResolvedValueOnce({
          ...userAccount,
          profile: {
            userId: 'user-1',
            displayName: 'New User',
            avatarUrl: null,
            bio: null,
            language: 'en',
            timezone: 'UTC',
            country: null,
          },
        });
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        displayName: 'New User',
        avatarUrl: null,
        bio: null,
        language: 'en',
        timezone: 'UTC',
        country: null,
      });

      await service.updateProfile(userToken, { displayName: 'New User' });

      expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: 'user-1',
            displayName: 'New User',
            language: 'en',
            timezone: 'UTC',
          }),
        }),
      );
    });

    it('cannot update another users profile because only JWT subject is used', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userAccount);
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue(userAccount.profile);

      await service.updateProfile(userToken, { bio: 'Updated bio' });

      expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
        }),
      );
    });

    it('throws when authenticated user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateProfile(userToken, { bio: 'Hello' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UpdateProfileSchema', () => {
    it('rejects empty update payloads', () => {
      const result = UpdateProfileSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('rejects invalid avatar URLs', () => {
      const result = UpdateProfileSchema.safeParse({ avatarUrl: 'not-a-url' });

      expect(result.success).toBe(false);
    });
  });
});
