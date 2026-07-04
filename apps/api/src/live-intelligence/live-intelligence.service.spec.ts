import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceService } from './live-intelligence.service';
import {
  assertAllowedLiveSessionStatusTransition,
  computeDurationSeconds,
} from './live-intelligence.utils';

jest.mock('@kolab/database', () => ({
  prisma: {
    liveSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creatorLiveSchedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    campaign: {
      findFirst: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  LiveSessionStatus: {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    ENDED: 'ENDED',
    CANCELLED: 'CANCELLED',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    Decimal: class Decimal {
      constructor(public value: number | string) {}
      toString() {
        return String(this.value);
      }
    },
  },
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

const noOrgToken: AccessTokenPayload = {
  ...managerToken,
  organizationId: undefined,
};

const baseCreatorProfile = {
  id: 'creator-1',
  organizationId: 'org-1',
};

const baseCampaign = {
  id: 'campaign-1',
  organizationId: 'org-1',
};

const baseSession = {
  id: 'session-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  campaignId: 'campaign-1',
  platform: 'TIKTOK',
  platformSessionId: 'tt-live-123',
  title: 'Evening Live',
  description: 'Q&A stream',
  startedAt: null,
  endedAt: null,
  scheduledStart: new Date('2026-07-04T20:00:00.000Z'),
  scheduledEnd: new Date('2026-07-04T22:00:00.000Z'),
  durationSeconds: null,
  peakViewers: null,
  totalViewers: null,
  totalGifts: null,
  totalGiftValue: null,
  status: 'SCHEDULED',
  metadata: { source: 'manual' },
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-03T12:00:00.000Z'),
};

const baseSchedule = {
  id: 'schedule-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  timezone: 'America/Los_Angeles',
  recurrenceRule: 'FREQ=WEEKLY',
  weekdays: [1, 3, 5],
  startTime: '20:00',
  endTime: '22:00',
  active: true,
  metadata: {},
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-03T12:00:00.000Z'),
};

describe('LiveIntelligenceService', () => {
  let service: LiveIntelligenceService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveIntelligenceService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(LiveIntelligenceService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
  });

  it('creates, lists, gets, and updates live sessions with audit events', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(baseCampaign);
    (prisma.liveSession.create as jest.Mock).mockResolvedValue(baseSession);
    (prisma.liveSession.findMany as jest.Mock).mockResolvedValue([baseSession]);
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(baseSession);
    (prisma.liveSession.update as jest.Mock).mockResolvedValue({
      ...baseSession,
      title: 'Updated Live',
    });

    const created = await service.createSession(managerToken, {
      creatorProfileId: 'creator-1',
      campaignId: 'campaign-1',
      platform: 'TIKTOK',
      title: 'Evening Live',
    });

    expect(created.status).toBe('SCHEDULED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_SESSION_CREATED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      }),
    );

    const listed = await service.listSessions(managerToken, { limit: 20 });
    expect(listed.items).toHaveLength(1);

    const fetched = await service.getSession(managerToken, 'session-1');
    expect(fetched.id).toBe('session-1');

    const updated = await service.updateSession(managerToken, 'session-1', {
      title: 'Updated Live',
    });
    expect(updated.title).toBe('Updated Live');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_SESSION_UPDATED,
      }),
    );
  });

  it('rejects invalid campaign and creator references', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createSession(managerToken, {
        creatorProfileId: 'missing-creator',
        platform: 'TIKTOK',
        title: 'Evening Live',
      }),
    ).rejects.toThrow(NotFoundException);

    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createSession(managerToken, {
        creatorProfileId: 'creator-1',
        campaignId: 'missing-campaign',
        platform: 'TIKTOK',
        title: 'Evening Live',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('enforces controlled status transitions and timestamps', async () => {
    const liveSession = {
      ...baseSession,
      status: 'SCHEDULED',
      startedAt: null,
      endedAt: null,
      durationSeconds: null,
    };

    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(liveSession);
    (prisma.liveSession.update as jest.Mock).mockImplementation(({ data }) =>
      Promise.resolve({
        ...liveSession,
        ...data,
        startedAt: data.startedAt ?? liveSession.startedAt,
        endedAt: data.endedAt ?? liveSession.endedAt,
        durationSeconds: data.durationSeconds ?? liveSession.durationSeconds,
      }),
    );

    const started = await service.updateSessionStatus(managerToken, 'session-1', {
      status: 'LIVE',
    });

    expect(started.status).toBe('LIVE');
    expect(started.startedAt).not.toBeNull();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_SESSION_STATUS_CHANGED,
        metadata: expect.objectContaining({
          previousStatus: 'SCHEDULED',
          status: 'LIVE',
        }),
      }),
    );

    const startedAt = new Date(Date.now() - 7200 * 1000);
    const liveSessionActive = {
      ...liveSession,
      status: 'LIVE',
      startedAt,
      endedAt: null,
      durationSeconds: null,
    };

    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(liveSessionActive);

    const ended = await service.updateSessionStatus(managerToken, 'session-1', {
      status: 'ENDED',
    });

    expect(ended.status).toBe('ENDED');
    expect(ended.endedAt).not.toBeNull();
    expect(ended.durationSeconds).toBe(7200);

    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue({
      ...liveSessionActive,
      status: 'ENDED',
    });

    await expect(
      service.updateSessionStatus(managerToken, 'session-1', { status: 'LIVE' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates, lists, gets, updates, and deletes schedules with audit events', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
    (prisma.creatorLiveSchedule.create as jest.Mock).mockResolvedValue(baseSchedule);
    (prisma.creatorLiveSchedule.findMany as jest.Mock).mockResolvedValue([baseSchedule]);
    (prisma.creatorLiveSchedule.findFirst as jest.Mock).mockResolvedValue(baseSchedule);
    (prisma.creatorLiveSchedule.update as jest.Mock).mockResolvedValue({
      ...baseSchedule,
      active: false,
    });
    (prisma.creatorLiveSchedule.delete as jest.Mock).mockResolvedValue(baseSchedule);

    const created = await service.createSchedule(managerToken, {
      creatorProfileId: 'creator-1',
      timezone: 'America/Los_Angeles',
      weekdays: [1, 3, 5],
      startTime: '20:00',
      endTime: '22:00',
    });

    expect(created.startTime).toBe('20:00');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_SCHEDULE_CREATED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SCHEDULE,
      }),
    );

    const listed = await service.listSchedules(managerToken, {});
    expect(listed.items).toHaveLength(1);

    const fetched = await service.getSchedule(managerToken, 'schedule-1');
    expect(fetched.id).toBe('schedule-1');

    const updated = await service.updateSchedule(managerToken, 'schedule-1', { active: false });
    expect(updated.active).toBe(false);

    await service.deleteSchedule(managerToken, 'schedule-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_SCHEDULE_DELETED,
      }),
    );
  });

  it('returns not found for cross-organization session and schedule access', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.creatorLiveSchedule.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getSession(otherOrgToken, 'session-1')).rejects.toThrow(NotFoundException);
    await expect(service.getSchedule(otherOrgToken, 'schedule-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('requires active organization membership', async () => {
    await expect(service.listSessions(noOrgToken, { limit: 20 })).rejects.toThrow(
      ForbiddenException,
    );

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'SUSPENDED',
    });

    await expect(service.listSessions(managerToken, { limit: 20 })).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('live-intelligence utils', () => {
  it('allows only valid live session status transitions', () => {
    expect(() => assertAllowedLiveSessionStatusTransition('SCHEDULED', 'LIVE')).not.toThrow();
    expect(() => assertAllowedLiveSessionStatusTransition('SCHEDULED', 'CANCELLED')).not.toThrow();
    expect(() => assertAllowedLiveSessionStatusTransition('LIVE', 'ENDED')).not.toThrow();
    expect(() => assertAllowedLiveSessionStatusTransition('ENDED', 'LIVE')).toThrow(
      BadRequestException,
    );
    expect(() => assertAllowedLiveSessionStatusTransition('CANCELLED', 'LIVE')).toThrow(
      BadRequestException,
    );
  });

  it('computes duration seconds between timestamps', () => {
    const startedAt = new Date('2026-07-04T20:00:00.000Z');
    const endedAt = new Date('2026-07-04T22:00:00.000Z');

    expect(computeDurationSeconds(startedAt, endedAt)).toBe(7200);
  });
});
