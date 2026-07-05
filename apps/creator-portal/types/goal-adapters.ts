import type { CreatorGoal, CreatorGoalStatus } from '@kolab/types';

export type GoalDisplayModel = {
  goal: CreatorGoal;
  progressPercent: number;
};

export type GroupedGoals = {
  active: GoalDisplayModel[];
  completed: GoalDisplayModel[];
  missed: GoalDisplayModel[];
};

/** Display-only progress from API-provided current and target values. */
export function toGoalDisplayModel(goal: CreatorGoal): GoalDisplayModel {
  return {
    goal,
    progressPercent: getDisplayProgressPercent(goal.currentValue, goal.targetValue),
  };
}

export function getDisplayProgressPercent(currentValue: string, targetValue: string): number {
  const current = Number.parseFloat(currentValue);
  const target = Number.parseFloat(targetValue);

  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export function groupGoalsByStatus(items: CreatorGoal[]): GroupedGoals {
  const grouped: GroupedGoals = {
    active: [],
    completed: [],
    missed: [],
  };

  for (const goal of items) {
    const model = toGoalDisplayModel(goal);
    switch (goal.status) {
      case 'ACTIVE':
        grouped.active.push(model);
        break;
      case 'COMPLETED':
        grouped.completed.push(model);
        break;
      case 'MISSED':
        grouped.missed.push(model);
        break;
      default:
        break;
    }
  }

  return grouped;
}

export function formatGoalType(goalType: CreatorGoal['goalType']): string {
  return goalType.replaceAll('_', ' ');
}

export function formatGoalStatus(status: CreatorGoalStatus): string {
  return status.replaceAll('_', ' ');
}
