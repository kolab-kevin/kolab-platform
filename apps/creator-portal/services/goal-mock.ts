import type { CreatorGoal, ListCreatorGoalsResponse } from '@kolab/types';

function buildGoal(
  partial: Pick<CreatorGoal, 'id' | 'goalType' | 'status' | 'title'> & {
    currentValue: string;
    targetValue: string;
    periodEnd: string;
    periodStart?: string;
  },
  creatorProfileId: string,
): CreatorGoal {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    organizationId: 'org_mock_001',
    creatorProfileId,
    goalType: partial.goalType,
    status: partial.status,
    title: partial.title,
    targetValue: partial.targetValue,
    currentValue: partial.currentValue,
    periodStart: partial.periodStart ?? now,
    periodEnd: partial.periodEnd,
    metadata: {},
    createdByUserId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createMockGoalsList(creatorProfileId: string): ListCreatorGoalsResponse {
  const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pastEnd = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  return {
    items: [
      buildGoal(
        {
          id: 'goal_active_1',
          goalType: 'LIVE_DAYS',
          status: 'ACTIVE',
          title: 'Stream 4 days this week',
          currentValue: '2.00',
          targetValue: '4.00',
          periodStart,
          periodEnd,
        },
        creatorProfileId,
      ),
      buildGoal(
        {
          id: 'goal_active_2',
          goalType: 'GIFT_VALUE',
          status: 'ACTIVE',
          title: 'Weekly gift revenue target',
          currentValue: '3200.00',
          targetValue: '5000.00',
          periodStart,
          periodEnd,
        },
        creatorProfileId,
      ),
      buildGoal(
        {
          id: 'goal_completed_1',
          goalType: 'CAMPAIGN_DELIVERABLES',
          status: 'COMPLETED',
          title: 'June campaign deliverables',
          currentValue: '3.00',
          targetValue: '3.00',
          periodStart,
          periodEnd: pastEnd,
        },
        creatorProfileId,
      ),
      buildGoal(
        {
          id: 'goal_missed_1',
          goalType: 'LIVE_HOURS',
          status: 'MISSED',
          title: 'May live hours',
          currentValue: '8.00',
          targetValue: '20.00',
          periodStart,
          periodEnd: pastEnd,
        },
        creatorProfileId,
      ),
    ],
    nextCursor: 'goal_missed_1',
  };
}

export function createEmptyGoalsList(): ListCreatorGoalsResponse {
  return {
    items: [],
    nextCursor: null,
  };
}
