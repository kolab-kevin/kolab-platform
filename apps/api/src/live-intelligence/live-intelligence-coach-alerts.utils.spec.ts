import {
  buildSessionCoachAlerts,
  deriveAlertPriority,
} from './live-intelligence-coach-alerts.utils';
import { buildSessionRecommendations } from './live-intelligence-recommendations.utils';
import { buildSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

describe('live-intelligence-coach-alerts.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');
  const sessionStartedAt = new Date('2026-07-04T20:00:00.000Z');

  const baseSession = {
    id: 'session-1',
    campaignId: null as string | null,
    status: 'LIVE' as const,
    startedAt: sessionStartedAt,
    durationSeconds: 3600,
  };

  const topGifter = {
    gifterProfileId: 'gifter-profile-1',
    externalGifterId: 'gifter-1',
    displayName: 'Whale',
    giftCount: 2,
    giftValue: 6000,
    spendingTier: 'WHALE',
  };

  const buildEvents = () => [
    {
      id: 'evt-start',
      eventType: 'SESSION_STARTED' as const,
      occurredAt: new Date('2026-07-04T20:00:00.000Z'),
      offsetMs: 0,
      externalActorId: null,
      actorDisplayName: null,
      payload: {},
    },
    {
      id: 'evt-song',
      eventType: 'SONG_STARTED' as const,
      occurredAt: new Date('2026-07-04T20:01:00.000Z'),
      offsetMs: 60_000,
      externalActorId: null,
      actorDisplayName: null,
      payload: {},
    },
    {
      id: 'evt-gift-early',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:01:10.000Z'),
      offsetMs: 70_000,
      externalActorId: 'gifter-1',
      actorDisplayName: 'Whale',
      payload: { giftType: 'UNIVERSE', diamondValue: 4000 },
    },
    {
      id: 'evt-gift-prior-window',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:50:00.000Z'),
      offsetMs: 3_050_000,
      externalActorId: 'gifter-2',
      actorDisplayName: 'Fan',
      payload: { giftType: 'GALAXY', diamondValue: 5000 },
    },
    {
      id: 'evt-gift-recent',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:55:00.000Z'),
      offsetMs: 3_300_000,
      externalActorId: 'gifter-1',
      actorDisplayName: 'Whale',
      payload: { giftType: 'UNIVERSE', diamondValue: 5000, text: 'secret chat body' },
    },
    {
      id: 'evt-viewer-1',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:00.000Z'),
      offsetMs: 3_360_000,
      externalActorId: 'viewer-1',
      actorDisplayName: 'Viewer 1',
      payload: {},
    },
    {
      id: 'evt-viewer-2',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:05.000Z'),
      offsetMs: 3_365_000,
      externalActorId: 'viewer-2',
      actorDisplayName: 'Viewer 2',
      payload: {},
    },
    {
      id: 'evt-viewer-3',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:10.000Z'),
      offsetMs: 3_370_000,
      externalActorId: 'viewer-3',
      actorDisplayName: 'Viewer 3',
      payload: {},
    },
    {
      id: 'evt-viewer-4',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:15.000Z'),
      offsetMs: 3_375_000,
      externalActorId: 'viewer-4',
      actorDisplayName: 'Viewer 4',
      payload: {},
    },
    {
      id: 'evt-viewer-5',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:20.000Z'),
      offsetMs: 3_380_000,
      externalActorId: 'viewer-5',
      actorDisplayName: 'Viewer 5',
      payload: {},
    },
    {
      id: 'evt-viewer-6',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:25.000Z'),
      offsetMs: 3_385_000,
      externalActorId: 'viewer-6',
      actorDisplayName: 'Viewer 6',
      payload: {},
    },
    {
      id: 'evt-viewer-7',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:30.000Z'),
      offsetMs: 3_390_000,
      externalActorId: 'viewer-7',
      actorDisplayName: 'Viewer 7',
      payload: {},
    },
    {
      id: 'evt-viewer-8',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:35.000Z'),
      offsetMs: 3_395_000,
      externalActorId: 'viewer-8',
      actorDisplayName: 'Viewer 8',
      payload: {},
    },
    {
      id: 'evt-viewer-9',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:40.000Z'),
      offsetMs: 3_400_000,
      externalActorId: 'viewer-9',
      actorDisplayName: 'Viewer 9',
      payload: {},
    },
    {
      id: 'evt-viewer-10',
      eventType: 'VIEWER_JOINED' as const,
      occurredAt: new Date('2026-07-04T20:56:45.000Z'),
      offsetMs: 3_405_000,
      externalActorId: 'viewer-10',
      actorDisplayName: 'Viewer 10',
      payload: {},
    },
    {
      id: 'evt-gift-late',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:57:00.000Z'),
      offsetMs: 3_420_000,
      externalActorId: 'gifter-2',
      actorDisplayName: 'Fan',
      payload: { giftType: 'ROSE', diamondValue: 50 },
    },
  ];

  it('derives alert priority from confidence and alert impact', () => {
    expect(deriveAlertPriority(0.9, 'TOP_GIFTER_ACTIVE')).toBe('HIGH');
    expect(deriveAlertPriority(0.4, 'PROMOTE_CAMPAIGN')).toBe('LOW');
  });

  it('builds deterministic alerts for the same input', () => {
    const events = buildEvents();
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      events.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
      generatedAt,
    );
    const recommendations = buildSessionRecommendations({
      session: {
        id: 'session-1',
        creatorProfileId: 'creator-1',
        campaignId: null,
        status: 'LIVE',
        startedAt: sessionStartedAt,
        durationSeconds: 3600,
        metadata: { triggerAnalysis },
      },
      events,
      topGifters: [topGifter],
      recentSessions: [],
      schedules: [],
      absentWhales: [],
      generatedAt,
    });

    const input = {
      session: baseSession,
      events,
      topGifters: [topGifter],
      recommendations,
      generatedAt,
    };

    expect(buildSessionCoachAlerts(input)).toEqual(buildSessionCoachAlerts(input));
  });

  it('generates alerts from recommendations and live signals', () => {
    const events = buildEvents();
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      events.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
      generatedAt,
    );
    const recommendations = buildSessionRecommendations({
      session: {
        id: 'session-1',
        creatorProfileId: 'creator-1',
        campaignId: null,
        status: 'LIVE',
        startedAt: sessionStartedAt,
        durationSeconds: 3600,
        metadata: { triggerAnalysis },
      },
      events,
      topGifters: [topGifter],
      recentSessions: [],
      schedules: [],
      absentWhales: [],
      generatedAt,
    });

    const result = buildSessionCoachAlerts({
      session: baseSession,
      events,
      topGifters: [topGifter],
      recommendations,
      generatedAt,
    });

    const types = result.alerts.map((alert) => alert.alertType);
    expect(types).toContain('TOP_GIFTER_ACTIVE');
    expect(types).toContain('HIGH_VALUE_GIFT_RECEIVED');
    expect(types).toContain('TRY_MUSIC_NOW');
    expect(types).toContain('THANK_SUPPORTER');
    expect(JSON.stringify(result)).not.toContain('secret chat body');
  });

  it('includes viewer spike alert when join spike is detected', () => {
    const events = buildEvents();

    const result = buildSessionCoachAlerts({
      session: baseSession,
      events,
      topGifters: [],
      recommendations: null,
      generatedAt,
    });

    expect(result.alerts.map((alert) => alert.alertType)).toContain('VIEWER_SPIKE');
  });

  it('includes gift velocity dropping alert when recent gifts slow down', () => {
    const events = [
      {
        id: 'evt-gift-prior',
        eventType: 'GIFT_RECEIVED' as const,
        occurredAt: new Date('2026-07-04T20:50:00.000Z'),
        offsetMs: 3_050_000,
        externalActorId: 'gifter-2',
        actorDisplayName: 'Fan',
        payload: { giftType: 'GALAXY', diamondValue: 5000 },
      },
      {
        id: 'evt-gift-recent-low',
        eventType: 'GIFT_RECEIVED' as const,
        occurredAt: new Date('2026-07-04T20:57:00.000Z'),
        offsetMs: 3_420_000,
        externalActorId: 'gifter-3',
        actorDisplayName: 'Fan 2',
        payload: { giftType: 'ROSE', diamondValue: 50 },
      },
    ];

    const result = buildSessionCoachAlerts({
      session: baseSession,
      events,
      topGifters: [],
      recommendations: null,
      generatedAt,
    });

    expect(result.alerts.map((alert) => alert.alertType)).toContain('GIFT_VELOCITY_DROPPING');
  });
});
