'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { PerformanceComponentScores } from '@/components/performance/performance-component-scores';
import { PerformanceNarrativeList } from '@/components/performance/performance-narrative-list';
import { PerformanceScoreHeader } from '@/components/performance/performance-score-header';
import { usePerformance } from '@/hooks/use-performance';
import { toPerformanceComponentScores } from '@/types/performance-adapters';

function sourceLabel(source: NonNullable<ReturnType<typeof usePerformance>['source']>): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No score generated';
    default:
      return source;
  }
}

export function PerformanceWorkspace() {
  const { data, loading, error, source, refresh } = usePerformance();

  if (loading) {
    return <InlineLoading label="Loading performance score…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load performance"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground text-sm">
            {source ? sourceLabel(source) : 'No data'}
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No performance score has been generated for this creator yet. Ask your agency manager to
          generate one from the admin tools.
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
    );
  }

  const components = toPerformanceComponentScores(data);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground text-sm">{source ? sourceLabel(source) : null}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      <PerformanceScoreHeader score={data} />
      <PerformanceComponentScores components={components} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PerformanceNarrativeList
          title="Strengths"
          items={data.strengths}
          emptyMessage="No strengths recorded."
        />
        <PerformanceNarrativeList
          title="Risks"
          items={data.risks}
          emptyMessage="No risks recorded."
        />
        <PerformanceNarrativeList
          title="Recommended Actions"
          items={data.recommendedActions}
          emptyMessage="No recommended actions."
        />
        <PerformanceNarrativeList
          title="Data Quality Warnings"
          items={data.dataQualityWarnings}
          emptyMessage="No data quality warnings."
          tone="warning"
        />
      </div>
    </div>
  );
}
