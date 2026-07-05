import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from '@/components/common/progress-bar';
import { StatusBadge } from '@/components/common/status-badge';
import { GoalCard } from '@/components/goals/goal-card';
import { GoalsSection } from '@/components/goals/goals-section';
import { createMockGoalsList } from '@/services/goal-mock';
import {
  type GoalDisplayModel,
  groupGoalsByStatus,
  toGoalDisplayModel,
} from '@/types/goal-adapters';

describe('goal adapters and presentation', () => {
  it('groups goals by status', () => {
    const grouped = groupGoalsByStatus(createMockGoalsList('creator_test').items);

    expect(grouped.active.length).toBeGreaterThan(0);
    expect(grouped.completed.length).toBeGreaterThan(0);
    expect(grouped.missed.length).toBeGreaterThan(0);
  });

  it('derives display progress percent from current and target values', () => {
    const model = toGoalDisplayModel({
      ...createMockGoalsList('creator_test').items[0],
      currentValue: '2.00',
      targetValue: '4.00',
    });

    expect(model.progressPercent).toBe(50);
  });

  it('renders goal card with progress and status badge', () => {
    const model = toGoalDisplayModel(createMockGoalsList('creator_test').items[0]);
    const html = renderToStaticMarkup(<GoalCard model={model} />);

    expect(html).toContain('Stream 4 days this week');
    expect(html).toContain('Current');
    expect(html).toContain('Target');
    expect(html).toContain('ACTIVE');
  });

  it('renders goals section empty state', () => {
    const html = renderToStaticMarkup(
      <GoalsSection title="Active Goals" goals={[]} emptyMessage="No active goals right now." />,
    );

    expect(html).toContain('No active goals right now.');
    expect(html).toContain('0 goals');
  });

  it('renders progress bar with clamped width', () => {
    const html = renderToStaticMarkup(<ProgressBar percent={150} />);
    expect(html).toContain('width:100%');
  });

  it('renders status badge labels', () => {
    const html = renderToStaticMarkup(<StatusBadge status="MISSED" />);
    expect(html).toContain('MISSED');
  });
});

describe('partial goal responses', () => {
  it('handles goals with non-numeric progress values', () => {
    const model: GoalDisplayModel = toGoalDisplayModel({
      ...createMockGoalsList('creator_test').items[0],
      currentValue: 'n/a',
      targetValue: '4.00',
    });

    expect(model.progressPercent).toBe(0);
    const html = renderToStaticMarkup(<GoalCard model={model} />);
    expect(html).toContain('0%');
  });
});
