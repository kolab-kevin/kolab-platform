'use client';

import {
  EmptyWorkspaceState,
  RefreshWorkspaceButton,
  WorkspacePage,
} from '@/components/common/workspace-page';
import { PerformanceComponentScores } from '@/components/performance/performance-component-scores';
import { PerformanceNarrativeList } from '@/components/performance/performance-narrative-list';
import { PerformanceScoreHeader } from '@/components/performance/performance-score-header';
import { usePerformance } from '@/hooks/use-performance';
import { WORKSPACE_GRID_CLASS } from '@/lib/studio-ui';
import { toPerformanceComponentScores } from '@/types/performance-adapters';

export function PerformanceWorkspace() {
  const { data, loading, error, source, refresh } = usePerformance();

  if (!loading && !error && !data) {
    return (
      <WorkspacePage
        title="Performance"
        source={source}
        loading={false}
        error={null}
        onRetry={() => void refresh()}
        emptyNotice={
          <EmptyWorkspaceState message="No performance score has been generated for this creator yet. Ask your agency manager to generate one from the admin tools." />
        }
      >
        <RefreshWorkspaceButton onClick={() => void refresh()} />
      </WorkspacePage>
    );
  }

  const components = data ? toPerformanceComponentScores(data) : [];

  return (
    <WorkspacePage
      title="Performance"
      description={data ? `Score ${data.overallScore}` : undefined}
      source={source}
      loading={loading}
      loadingLabel="Loading performance score…"
      error={error}
      errorTitle="Unable to load performance"
      onRetry={() => void refresh()}
    >
      {data ? (
        <>
          <PerformanceScoreHeader score={data} />
          <PerformanceComponentScores components={components} />
          <div className={WORKSPACE_GRID_CLASS}>
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
        </>
      ) : null}
    </WorkspacePage>
  );
}
