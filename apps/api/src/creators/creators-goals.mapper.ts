import type {
  CreatorGoal as PrismaCreatorGoal,
  CreatorGoalProgress as PrismaCreatorGoalProgress,
} from '@kolab/database';
import type { CreatorGoal, CreatorGoalProgress } from '@kolab/types';

export function toCreatorGoal(goal: PrismaCreatorGoal): CreatorGoal {
  return {
    id: goal.id,
    organizationId: goal.organizationId,
    creatorProfileId: goal.creatorProfileId,
    goalType: goal.goalType as CreatorGoal['goalType'],
    status: goal.status as CreatorGoal['status'],
    title: goal.title,
    targetValue: goal.targetValue.toString(),
    currentValue: goal.currentValue.toString(),
    periodStart: goal.periodStart.toISOString(),
    periodEnd: goal.periodEnd.toISOString(),
    metadata: goal.metadata as CreatorGoal['metadata'],
    createdByUserId: goal.createdByUserId,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export function toCreatorGoalProgress(progress: PrismaCreatorGoalProgress): CreatorGoalProgress {
  return {
    id: progress.id,
    organizationId: progress.organizationId,
    creatorGoalId: progress.creatorGoalId,
    currentValue: progress.currentValue.toString(),
    targetValue: progress.targetValue.toString(),
    progressPercent: progress.progressPercent,
    calculationSummary: progress.calculationSummary as CreatorGoalProgress['calculationSummary'],
    recalculatedAt: progress.recalculatedAt.toISOString(),
    metadata: progress.metadata as CreatorGoalProgress['metadata'],
    createdAt: progress.createdAt.toISOString(),
  };
}
