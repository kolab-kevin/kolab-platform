import { z } from 'zod';

export const LiveOperationsDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type LiveOperationsDataSource = z.infer<typeof LiveOperationsDataSourceSchema>;

export const ManagerLiveSessionHealthSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'WARNING',
  'CRITICAL',
  'UNKNOWN',
]);

export type ManagerLiveSessionHealth = z.infer<typeof ManagerLiveSessionHealthSchema>;

export const ManagerLiveSessionItemSchema = z.object({
  id: z.string(),
  creatorProfileId: z.string(),
  creatorDisplayName: z.string(),
  title: z.string(),
  platform: z.string(),
  status: z.string(),
  viewerCount: z.number().int().nonnegative().nullable(),
  giftRevenue: z.string().nullable(),
  durationLabel: z.string(),
  health: ManagerLiveSessionHealthSchema,
  healthScore: z.number().int().min(0).max(100).nullable(),
  startedAt: z.string().nullable(),
});

export type ManagerLiveSessionItem = z.infer<typeof ManagerLiveSessionItemSchema>;

export const ManagerAgencyAlertItemSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  creatorDisplayName: z.string(),
  title: z.string(),
  message: z.string(),
  priority: z.string(),
  alertType: z.string(),
});

export type ManagerAgencyAlertItem = z.infer<typeof ManagerAgencyAlertItemSchema>;

export const ManagerAgencyMonitoringSchema = z.object({
  creatorsLiveNow: z.number().int().nonnegative(),
  openAlerts: z.number().int().nonnegative(),
  viewerSpikes: z.number().int().nonnegative(),
  giftSpikes: z.number().int().nonnegative(),
  connectionIssues: z.number().int().nonnegative(),
  streamQualityIssues: z.number().int().nonnegative(),
  liveCreators: z.array(
    z.object({
      sessionId: z.string(),
      creatorDisplayName: z.string(),
      title: z.string(),
      platform: z.string(),
      viewerCount: z.number().int().nonnegative().nullable(),
    }),
  ),
  alerts: z.array(ManagerAgencyAlertItemSchema),
});

export type ManagerAgencyMonitoring = z.infer<typeof ManagerAgencyMonitoringSchema>;

export const ManagerCoachQueueItemSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  creatorDisplayName: z.string(),
  priority: z.string(),
  kind: z.enum(['ALERT', 'RECOMMENDATION']),
  title: z.string(),
  summary: z.string(),
  recommendedAction: z.string().nullable(),
  needsReview: z.boolean(),
});

export type ManagerCoachQueueItem = z.infer<typeof ManagerCoachQueueItemSchema>;

export const ManagerTimelineEventItemSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  eventType: z.string(),
  label: z.string(),
  detail: z.string().nullable(),
  category: z.enum(['KEY', 'PK', 'GIFT', 'MILESTONE', 'OTHER']),
});

export type ManagerTimelineEventItem = z.infer<typeof ManagerTimelineEventItemSchema>;

export const ManagerLiveOperationsWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  sessions: z.array(ManagerLiveSessionItemSchema),
  agencyMonitoring: ManagerAgencyMonitoringSchema,
  coachQueue: z.array(ManagerCoachQueueItemSchema),
  timeline: z.array(ManagerTimelineEventItemSchema),
  selectedSessionId: z.string().nullable(),
});

export type ManagerLiveOperationsWorkspace = z.infer<typeof ManagerLiveOperationsWorkspaceSchema>;
