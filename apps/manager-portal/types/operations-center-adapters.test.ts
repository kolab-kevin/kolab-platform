import { describe, expect, it } from 'vitest';

import {
  buildOperationsOverview,
  groupTasksByBucket,
  mapAuditLogToActivity,
} from '@/types/operations-center-adapters';

describe('operations center adapters', () => {
  it('builds overview counts from tasks, alerts, and deadlines', () => {
    const tasks = groupTasksByBucket([
      {
        id: 'task_1',
        title: 'Task',
        description: null,
        priority: 'HIGH',
        bucket: 'assigned',
        assigneeName: null,
        dueAt: null,
        sourceLabel: 'Campaign',
      },
      {
        id: 'task_2',
        title: 'Done',
        description: null,
        priority: 'LOW',
        bucket: 'completed',
        assigneeName: null,
        dueAt: null,
        sourceLabel: 'Operations',
      },
    ]);

    const overview = buildOperationsOverview({
      tasks,
      alerts: {
        live: [
          {
            id: 'alert_1',
            title: 'Live alert',
            category: 'live',
            priority: 'HIGH',
            occurredAt: new Date().toISOString(),
            entityLabel: 'Creator',
          },
        ],
        coach: [],
        compliance: [],
        campaign: [],
        recruiting: [],
      },
      deadlines: {
        deliverables: [],
        campaigns: [
          {
            id: 'deadline_1',
            title: 'Campaign deadline',
            category: 'campaigns',
            dueAt: new Date().toISOString(),
            entityLabel: 'Brand',
            priority: 'MEDIUM',
          },
        ],
        contracts: [],
        compliance: [],
        documents: [],
      },
      overdueFollowUps: 2,
    });

    expect(overview.openTasks).toBe(1);
    expect(overview.criticalAlerts).toBe(1);
    expect(overview.overdueFollowUps).toBe(2);
  });

  it('maps audit logs to activity feed items', () => {
    const activity = mapAuditLogToActivity({
      id: 'audit_1',
      organizationId: 'org_1',
      actorUserId: 'user_1',
      action: 'live.session.started',
      targetType: 'live_session',
      targetId: 'session_1',
      metadata: {},
      createdAt: new Date().toISOString(),
    });

    expect(activity.activityType).toBe('live_session_started');
  });
});
