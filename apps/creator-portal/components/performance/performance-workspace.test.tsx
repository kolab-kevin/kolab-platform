import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ScoreBandBadge } from '@/components/common/score-band-badge';
import { PerformanceComponentScores } from '@/components/performance/performance-component-scores';
import { PerformanceNarrativeList } from '@/components/performance/performance-narrative-list';
import { PerformanceScoreHeader } from '@/components/performance/performance-score-header';
import { createMockPerformanceScore } from '@/services/performance-mock';
import { formatTrendDirection, toPerformanceComponentScores } from '@/types/performance-adapters';

describe('performance adapters and presentation', () => {
  const score = createMockPerformanceScore('creator_test');

  it('maps component scores for display', () => {
    const components = toPerformanceComponentScores(score);

    expect(components).toHaveLength(8);
    expect(components.map((item) => item.label)).toContain('Reliability');
    expect(components.map((item) => item.label)).toContain('Campaign Execution');
  });

  it('renders performance score header with band and trend', () => {
    const html = renderToStaticMarkup(<PerformanceScoreHeader score={score} />);

    expect(html).toContain('Overall Score');
    expect(html).toContain('78');
    expect(html).toContain('GOOD');
    expect(html).toContain('IMPROVING');
  });

  it('renders component score grid', () => {
    const html = renderToStaticMarkup(
      <PerformanceComponentScores components={toPerformanceComponentScores(score)} />,
    );

    expect(html).toContain('Component Scores');
    expect(html).toContain('Reliability');
    expect(html).toContain('Risk');
  });

  it('renders narrative list empty state', () => {
    const html = renderToStaticMarkup(
      <PerformanceNarrativeList
        title="Data Quality Warnings"
        items={[]}
        emptyMessage="No data quality warnings."
      />,
    );

    expect(html).toContain('No data quality warnings.');
  });

  it('renders score band badge', () => {
    const html = renderToStaticMarkup(<ScoreBandBadge band="EXCELLENT" />);
    expect(html).toContain('EXCELLENT');
  });

  it('formats missing trend direction', () => {
    expect(formatTrendDirection(null)).toBe('Not available');
    expect(formatTrendDirection(undefined)).toBe('Not available');
  });
});

describe('partial performance responses', () => {
  it('renders with empty narrative arrays', () => {
    const score = {
      ...createMockPerformanceScore('creator_partial'),
      strengths: [],
      risks: [],
      recommendedActions: [],
      dataQualityWarnings: [],
      trendDirection: null,
    };

    const html = renderToStaticMarkup(
      <>
        <PerformanceScoreHeader score={score} />
        <PerformanceNarrativeList
          title="Strengths"
          items={score.strengths}
          emptyMessage="No strengths recorded."
        />
      </>,
    );

    expect(html).toContain('Not available');
    expect(html).toContain('No strengths recorded.');
  });
});
