import { ProgressBar } from '@/components/common/progress-bar';
import { StatusBadge } from '@/components/common/status-badge';
import type { GoalDisplayModel } from '@/types/goal-adapters';
import { formatGoalType } from '@/types/goal-adapters';

type GoalCardProps = {
  model: GoalDisplayModel;
};

export function GoalCard({ model }: GoalCardProps) {
  const { goal, progressPercent } = model;

  return (
    <article className="border-border/60 rounded-xl border bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{goal.title ?? formatGoalType(goal.goalType)}</p>
          <p className="text-muted-foreground mt-1 text-xs uppercase tracking-wide">
            {formatGoalType(goal.goalType)}
          </p>
        </div>
        <StatusBadge status={goal.status} />
      </div>

      <ProgressBar percent={progressPercent} className="mb-3" />

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground text-xs">Current</dt>
          <dd className="font-medium">{goal.currentValue}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Target</dt>
          <dd className="font-medium">{goal.targetValue}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Complete</dt>
          <dd className="font-medium">{progressPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Due</dt>
          <dd className="font-medium">{new Date(goal.periodEnd).toLocaleDateString()}</dd>
        </div>
      </dl>
    </article>
  );
}
