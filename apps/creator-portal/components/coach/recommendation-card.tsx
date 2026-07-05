import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { ConfidenceIndicator } from '@/components/common/confidence-indicator';
import { PriorityBadge } from '@/components/common/priority-badge';
import type { RecommendationDisplayModel } from '@/types/coach-adapters';
import { formatCoachLabel } from '@/types/coach-adapters';

type RecommendationCardProps = {
  recommendation: RecommendationDisplayModel;
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <article className="border-border/60 rounded-lg border bg-white/[0.02] px-4 py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{recommendation.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {formatCoachLabel(recommendation.recommendationType)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={recommendation.priority} />
          <CampaignStatusBadge status={recommendation.recommendationType} />
        </div>
      </div>
      <p className="text-sm leading-relaxed">{recommendation.description}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ConfidenceIndicator score={recommendation.confidenceScore} />
        <span className="text-muted-foreground text-xs">
          {new Date(recommendation.generatedAt).toLocaleString()}
        </span>
      </div>
      {recommendation.supportingEvidence.length > 0 ? (
        <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
          {recommendation.supportingEvidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
