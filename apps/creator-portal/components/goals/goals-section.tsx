import { GoalCard } from '@/components/goals/goal-card';
import type { GoalDisplayModel } from '@/types/goal-adapters';

type GoalsSectionProps = {
  title: string;
  goals: GoalDisplayModel[];
  emptyMessage: string;
};

export function GoalsSection({ title, goals, emptyMessage }: GoalsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-muted-foreground text-xs">{goals.length} goals</span>
      </div>
      {goals.length === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
          {emptyMessage}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {goals.map((model) => (
            <li key={model.goal.id}>
              <GoalCard model={model} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
