import { cn } from '@kolab/ui';

import { formatConfidenceScore } from '@/types/coach-adapters';

type ConfidenceIndicatorProps = {
  score: number;
  className?: string;
};

function confidenceClass(score: number): string {
  if (score >= 0.8) return 'text-emerald-200';
  if (score >= 0.6) return 'text-amber-100';
  return 'text-muted-foreground';
}

export function ConfidenceIndicator({ score, className }: ConfidenceIndicatorProps) {
  return (
    <span className={cn('text-xs font-medium', confidenceClass(score), className)}>
      {formatConfidenceScore(score)} confidence
    </span>
  );
}
