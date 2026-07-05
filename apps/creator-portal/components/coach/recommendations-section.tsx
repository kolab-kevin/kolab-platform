import type { LiveRecommendationPriority } from '@kolab/types';

import { RecommendationCard } from '@/components/coach/recommendation-card';
import type { GroupedRecommendations } from '@/types/coach-adapters';

const PRIORITY_LABELS: Record<LiveRecommendationPriority, string> = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium Priority',
  LOW: 'Low Priority',
};

type RecommendationsSectionProps = {
  recommendations: GroupedRecommendations;
};

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  const total = Object.values(recommendations).reduce((count, items) => count + items.length, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Recommendations</h2>
        <span className="text-muted-foreground text-xs">{total} recommendations</span>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
          No recommendations available.
        </p>
      ) : (
        <div className="space-y-5">
          {(Object.keys(PRIORITY_LABELS) as LiveRecommendationPriority[]).map((priority) => (
            <div key={priority} className="space-y-2">
              <h3 className="text-sm font-semibold">{PRIORITY_LABELS[priority]}</h3>
              {recommendations[priority].length === 0 ? (
                <p className="text-muted-foreground text-xs">None</p>
              ) : (
                <ul className="space-y-2">
                  {recommendations[priority].map((item) => (
                    <li key={item.id}>
                      <RecommendationCard recommendation={item} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
