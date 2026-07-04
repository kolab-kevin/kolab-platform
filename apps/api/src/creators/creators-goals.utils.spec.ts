import { BadRequestException } from '@nestjs/common';

import {
  assertAllowedCreatorGoalStatusTransition,
  computeProgressPercent,
  deriveAutoGoalStatus,
  recalculateCreatorGoalValue,
} from './creators-goals.utils';

describe('creators-goals.utils', () => {
  const periodStart = new Date('2026-06-01T00:00:00.000Z');
  const periodEnd = new Date('2026-06-30T23:59:59.000Z');

  describe('assertAllowedCreatorGoalStatusTransition', () => {
    it('allows ACTIVE to COMPLETED', () => {
      expect(() => assertAllowedCreatorGoalStatusTransition('ACTIVE', 'COMPLETED')).not.toThrow();
    });

    it('rejects invalid transitions', () => {
      expect(() => assertAllowedCreatorGoalStatusTransition('COMPLETED', 'ACTIVE')).toThrow(
        BadRequestException,
      );
    });

    it('rejects setting the same status', () => {
      expect(() => assertAllowedCreatorGoalStatusTransition('ACTIVE', 'ACTIVE')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('computeProgressPercent', () => {
    it('caps at 100 percent', () => {
      expect(computeProgressPercent(150, 100)).toBe(100);
    });

    it('returns zero when target is zero and current is zero', () => {
      expect(computeProgressPercent(0, 0)).toBe(0);
    });
  });

  describe('deriveAutoGoalStatus', () => {
    it('marks ACTIVE goals completed when target is met', () => {
      expect(
        deriveAutoGoalStatus({
          status: 'ACTIVE',
          currentValue: 10,
          targetValue: 10,
          periodEnd,
        }),
      ).toBe('COMPLETED');
    });

    it('marks ACTIVE goals missed after period end', () => {
      expect(
        deriveAutoGoalStatus({
          status: 'ACTIVE',
          currentValue: 5,
          targetValue: 10,
          periodEnd,
          now: new Date('2026-07-01T00:00:00.000Z'),
        }),
      ).toBe('MISSED');
    });
  });

  describe('recalculateCreatorGoalValue', () => {
    const sessions = [
      {
        id: 'session-1',
        startedAt: new Date('2026-06-10T18:00:00.000Z'),
        endedAt: new Date('2026-06-10T19:30:00.000Z'),
        durationSeconds: 5400,
        totalGifts: 10,
        totalGiftValue: { toString: () => '250.00' },
        status: 'ENDED',
      },
      {
        id: 'session-2',
        startedAt: new Date('2026-06-11T18:00:00.000Z'),
        endedAt: new Date('2026-06-11T19:00:00.000Z'),
        durationSeconds: 3600,
        totalGifts: 5,
        totalGiftValue: { toString: () => '100.00' },
        status: 'ENDED',
      },
    ];

    it('recalculates live hours from session durations', () => {
      const result = recalculateCreatorGoalValue({
        goalType: 'LIVE_HOURS',
        targetValue: 10,
        periodStart,
        periodEnd,
        sessions,
        approvedDeliverableCount: 0,
        performanceScore: null,
        complianceStatus: null,
        gifterStats: [],
      });

      expect(result.currentValue).toBe(2.5);
      expect(result.calculationSummary.source).toBe('live_sessions');
    });

    it('recalculates live days from distinct session dates', () => {
      const result = recalculateCreatorGoalValue({
        goalType: 'LIVE_DAYS',
        targetValue: 5,
        periodStart,
        periodEnd,
        sessions,
        approvedDeliverableCount: 0,
        performanceScore: null,
        complianceStatus: null,
        gifterStats: [],
      });

      expect(result.currentValue).toBe(2);
      expect(result.calculationSummary.distinctLiveDays).toBe(2);
    });

    it('recalculates campaign deliverables from approved count', () => {
      const result = recalculateCreatorGoalValue({
        goalType: 'CAMPAIGN_DELIVERABLES',
        targetValue: 3,
        periodStart,
        periodEnd,
        sessions: [],
        approvedDeliverableCount: 2,
        performanceScore: null,
        complianceStatus: null,
        gifterStats: [],
      });

      expect(result.currentValue).toBe(2);
      expect(result.calculationSummary.source).toBe('campaign_creator_deliverables');
    });

    it('recalculates performance score from stored score', () => {
      const result = recalculateCreatorGoalValue({
        goalType: 'PERFORMANCE_SCORE',
        targetValue: 80,
        periodStart,
        periodEnd,
        sessions: [],
        approvedDeliverableCount: 0,
        performanceScore: {
          overallScore: 76,
          complianceScore: 90,
          consistencyScore: 72,
          generatedAt: '2026-06-15T12:00:00.000Z',
        },
        complianceStatus: 'COMPLIANT',
        gifterStats: [],
      });

      expect(result.currentValue).toBe(76);
      expect(result.calculationSummary.source).toBe('creator_performance_score');
    });
  });
});
