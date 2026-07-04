import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceGiftersService } from './live-intelligence-gifters.service';
import { sanitizeAggregateMetadata } from './live-intelligence-gifters.utils';

jest.mock('@kolab/database', () => ({
  prisma: {
    gifterProfile: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    gifterSessionStats: {
      findMany: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
    },
    liveSession: {
      findFirst: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
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

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const baseProfile = {
  id: 'gifter-1',
  organizationId: 'org-1',
  platform: 'TIKTOK',
  externalGifterId: 'tt-gifter-1',
  displayName: 'WhaleFan',
  avatarUrl: 'https://example.com/avatar.png',
  spendingTier: 'WHALE',
  totalGiftCount: 42,
  totalGiftValue: { toString: () => '5000.00' },
  totalSessions: 7,
  firstSeenAt: new Date('2026-06-01T00:00:00.000Z'),
  lastSeenAt: new Date('2026-07-04T20:00:00.000Z'),
  favoriteCreatorProfileId: 'creator-1',
  favoriteGiftType: 'ROSE',
  triggerProfile: { singing: 0.8 },
  retentionProfile: { score: 0.9 },
  metadata: { source: 'rollup' },
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-04T20:00:00.000Z'),
};

const baseSessionStats = {
  id: 'stats-1',
  organizationId: 'org-1',
  gifterProfileId: 'gifter-1',
  liveSessionId: 'session-1',
  creatorProfileId: 'creator-1',
  giftCount: 10,
  giftValue: { toString: () => '1000.00' },
  firstGiftAt: new Date('2026-07-04T20:05:00.000Z'),
  lastGiftAt: new Date('2026-07-04T20:30:00.000Z'),
  firstSeenAt: new Date('2026-07-04T20:00:00.000Z'),
  lastSeenAt: new Date('2026-07-04T20:30:00.000Z'),
  chatMessageCount: 5,
  metadata: { rollupVersion: 1 },
  createdAt: new Date('2026-07-04T20:05:00.000Z'),
  updatedAt: new Date('2026-07-04T20:30:00.000Z'),
};

describe('LiveIntelligenceGiftersService', () => {
  let service: LiveIntelligenceGiftersService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceGiftersService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceGiftersService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
  });

  it('lists gifter profiles with filters', async () => {
    (prisma.gifterProfile.findMany as jest.Mock).mockResolvedValue([baseProfile]);

    const result = await service.listGifterProfiles(managerToken, {
      limit: 20,
      platform: 'TIKTOK',
      spendingTier: 'WHALE',
      creatorProfileId: 'creator-1',
      search: 'Whale',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.spendingTier).toBe('WHALE');
    expect(prisma.gifterProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          platform: 'TIKTOK',
          spendingTier: 'WHALE',
        }),
      }),
    );
  });

  it('returns gifter profile detail with recent stats, favorite creator, and audit', async () => {
    (prisma.gifterProfile.findFirst as jest.Mock).mockResolvedValue(baseProfile);
    (prisma.gifterSessionStats.findMany as jest.Mock).mockResolvedValue([baseSessionStats]);
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
      id: 'creator-1',
      displayName: 'Star Creator',
    });

    const result = await service.getGifterProfile(managerToken, 'gifter-1');

    expect(result.profile.id).toBe('gifter-1');
    expect(result.recentSessionStats).toHaveLength(1);
    expect(result.recentSessionStats[0]?.chatMessageCount).toBe(5);
    expect(result.favoriteCreator).toEqual({
      creatorProfileId: 'creator-1',
      displayName: 'Star Creator',
    });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_GIFTER_PROFILE_VIEWED,
        targetType: AUDIT_TARGET_TYPE.GIFTER_PROFILE,
        targetId: 'gifter-1',
      }),
    );
  });

  it('lists gifter session stats for a profile', async () => {
    (prisma.gifterProfile.findFirst as jest.Mock).mockResolvedValue(baseProfile);
    (prisma.gifterSessionStats.findMany as jest.Mock).mockResolvedValue([baseSessionStats]);

    const result = await service.listGifterSessions(managerToken, 'gifter-1', { limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.liveSessionId).toBe('session-1');
  });

  it('lists session gifters with profile and stats aggregates', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
    });
    (prisma.gifterSessionStats.findMany as jest.Mock).mockResolvedValue([
      {
        ...baseSessionStats,
        gifterProfile: baseProfile,
      },
    ]);

    const result = await service.listSessionGifters(managerToken, 'session-1', { limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.profile.externalGifterId).toBe('tt-gifter-1');
    expect(result.items[0]?.sessionStats.giftCount).toBe(10);
  });

  it('returns not found for cross-organization gifter access', async () => {
    (prisma.gifterProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getGifterProfile(otherOrgToken, 'gifter-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('requires active organization membership', async () => {
    await expect(
      service.listGifterProfiles({ ...managerToken, organizationId: undefined }, { limit: 20 }),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('gifter aggregate sanitization', () => {
  it('redacts raw chat/transcript-like metadata values', () => {
    const sanitized = sanitizeAggregateMetadata({
      source: 'rollup',
      chatMessage: 'secret transcript text that should never leak',
      nested: {
        transcriptText: 'data:audio/wav;base64,abc',
      },
    });

    expect(sanitized).not.toHaveProperty('chatMessage');
    expect(sanitized).not.toHaveProperty('nested');
    expect(JSON.stringify(sanitized)).not.toContain('secret transcript');
  });
});
