import type { ManagerOperationsCenterWorkspace } from '@/types/operations-center';
import {
  buildOperationsOverview,
  groupAiRecommendations,
  groupTasksByBucket,
} from '@/types/operations-center-adapters';

const now = new Date();
const iso = (offsetDays: number, hour = 10) => {
  const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export function createMockOperationsCenterWorkspace(
  organizationId: string,
): ManagerOperationsCenterWorkspace {
  const tasks = groupTasksByBucket([
    {
      id: 'task_001',
      title: 'Review overdue deliverables for Summer launch',
      description: '3 deliverables past due',
      priority: 'HIGH',
      bucket: 'assigned',
      assigneeName: 'Jordan Lee',
      dueAt: iso(-1, 9),
      sourceLabel: 'Campaign',
    },
    {
      id: 'task_002',
      title: 'Coach queue review for Morning Live Shop',
      description: '2 high-priority coach alerts',
      priority: 'HIGH',
      bucket: 'inProgress',
      assigneeName: 'You',
      dueAt: iso(0, 16),
      sourceLabel: 'Live',
    },
    {
      id: 'task_003',
      title: 'Approve pending campaign applications',
      description: '7 applications waiting',
      priority: 'MEDIUM',
      bucket: 'waiting',
      assigneeName: null,
      dueAt: iso(2, 12),
      sourceLabel: 'Campaign',
    },
    {
      id: 'task_004',
      title: 'Follow up with Alex Rivera',
      description: 'Interested lead follow-up',
      priority: 'MEDIUM',
      bucket: 'waiting',
      assigneeName: 'Jordan Lee',
      dueAt: iso(0, 14),
      sourceLabel: 'Recruiting',
    },
    {
      id: 'task_005',
      title: 'Export weekly operations report',
      description: 'Completed last Friday',
      priority: 'LOW',
      bucket: 'completed',
      assigneeName: 'You',
      dueAt: iso(-3),
      sourceLabel: 'Operations',
    },
  ]);

  const alerts = {
    live: [
      {
        id: 'alert_live_001',
        title: 'Viewer spike detected on Morning Live Shop',
        category: 'live' as const,
        priority: 'HIGH' as const,
        occurredAt: iso(0, 11),
        entityLabel: 'Alex Rivera',
      },
    ],
    coach: [
      {
        id: 'alert_coach_001',
        title: 'Thank top gifter now',
        category: 'coach' as const,
        priority: 'HIGH' as const,
        occurredAt: iso(0, 11),
        entityLabel: 'Morning Live Shop',
      },
    ],
    compliance: [
      {
        id: 'alert_comp_001',
        title: '2 creators blocked pending tax documents',
        category: 'compliance' as const,
        priority: 'HIGH' as const,
        occurredAt: iso(-1),
        entityLabel: null,
      },
    ],
    campaign: [
      {
        id: 'alert_camp_001',
        title: 'Campaign paused: Fitness Challenge Q3',
        category: 'campaign' as const,
        priority: 'MEDIUM' as const,
        occurredAt: iso(-2),
        entityLabel: 'Fitness Challenge Q3',
      },
    ],
    recruiting: [
      {
        id: 'alert_rec_001',
        title: 'Overdue follow-up for Sam Ortiz',
        category: 'recruiting' as const,
        priority: 'HIGH' as const,
        occurredAt: iso(-1, 9),
        entityLabel: 'Sam Ortiz',
      },
    ],
  };

  const deadlines = {
    deliverables: [
      {
        id: 'deadline_del_001',
        title: 'Summer launch hero video',
        category: 'deliverables' as const,
        dueAt: iso(1, 17),
        entityLabel: 'Summer Beauty Launch',
        priority: 'HIGH' as const,
      },
    ],
    campaigns: [
      {
        id: 'deadline_camp_001',
        title: 'Back-to-School Tech Drop',
        category: 'campaigns' as const,
        dueAt: iso(5),
        entityLabel: 'Pulse Gear',
        priority: 'MEDIUM' as const,
      },
    ],
    contracts: [
      {
        id: 'deadline_contract_001',
        title: 'Creator agreement renewal',
        category: 'contracts' as const,
        dueAt: iso(10),
        entityLabel: 'Maya Chen',
        priority: 'MEDIUM' as const,
      },
    ],
    compliance: [
      {
        id: 'deadline_comp_001',
        title: 'Tax document review deadline',
        category: 'compliance' as const,
        dueAt: iso(3),
        entityLabel: 'Portfolio compliance',
        priority: 'HIGH' as const,
      },
    ],
    documents: [
      {
        id: 'deadline_doc_001',
        title: 'W-9 expiring',
        category: 'documents' as const,
        dueAt: iso(7),
        entityLabel: 'Jordan Blake',
        priority: 'MEDIUM' as const,
      },
    ],
  };

  const activityFeed = [
    {
      id: 'activity_001',
      title: 'Creator converted from lead',
      activityType: 'creator_signed' as const,
      occurredAt: iso(-1, 15),
      actorLabel: 'Jordan Lee',
      description: 'Riley Nguyen signed creator agreement',
    },
    {
      id: 'activity_002',
      title: 'Campaign updated',
      activityType: 'campaign_updated' as const,
      occurredAt: iso(-1, 10),
      actorLabel: 'Manager',
      description: 'Summer Beauty Launch budget adjusted',
    },
    {
      id: 'activity_003',
      title: 'Live session started',
      activityType: 'live_session_started' as const,
      occurredAt: iso(0, 9),
      actorLabel: 'Alex Rivera',
      description: 'Morning Live Shop went live',
    },
    {
      id: 'activity_004',
      title: 'Coach alert created',
      activityType: 'alert_created' as const,
      occurredAt: iso(0, 11),
      actorLabel: 'System',
      description: 'Viewer spike on Morning Live Shop',
    },
    {
      id: 'activity_005',
      title: 'Goal completed',
      activityType: 'goal_completed' as const,
      occurredAt: iso(-2),
      actorLabel: 'Maya Chen',
      description: 'Weekly posting goal completed',
    },
  ];

  const aiRecommendations = groupAiRecommendations([
    {
      id: 'rec_001',
      title: 'Prioritize coach response on live spike',
      priority: 'HIGH',
      summary: 'Morning Live Shop has unresolved high-priority coach alerts.',
      sourceLabel: 'Live Intelligence',
    },
    {
      id: 'rec_002',
      title: 'Review overdue recruiting follow-ups',
      priority: 'MEDIUM',
      summary: 'Two assigned leads are past their follow-up dates.',
      sourceLabel: 'Recruiting CRM',
    },
    {
      id: 'rec_003',
      title: 'Schedule compliance document review',
      priority: 'LOW',
      summary: 'Five documents expire within two weeks.',
      sourceLabel: 'Compliance',
    },
  ]);

  const overview = buildOperationsOverview({
    tasks,
    alerts,
    deadlines,
    overdueFollowUps: 2,
  });

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    overview,
    tasks,
    alerts,
    deadlines,
    activityFeed,
    aiRecommendations,
  };
}
