import type { CreatorGoalStatus, CreatorGoalType } from '@kolab/types';
import { BadRequestException } from '@nestjs/common';

const GOAL_STATUS_TRANSITIONS: Record<CreatorGoalStatus, CreatorGoalStatus[]> = {
  ACTIVE: ['COMPLETED', 'MISSED', 'CANCELLED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  MISSED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function assertAllowedCreatorGoalStatusTransition(
  currentStatus: CreatorGoalStatus,
  nextStatus: CreatorGoalStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Goal status is already set to the requested value');
  }

  const allowed = GOAL_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition creator goal status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertCreatorGoalIsEditable(status: CreatorGoalStatus): void {
  if (status === 'ARCHIVED' || status === 'CANCELLED') {
    throw new BadRequestException('Creator goal cannot be modified in the current status');
  }
}

export function assertCreatorGoalIsRecalculable(status: CreatorGoalStatus): void {
  if (status === 'ARCHIVED' || status === 'CANCELLED') {
    throw new BadRequestException(
      'Creator goal progress cannot be recalculated in the current status',
    );
  }
}

export function computeProgressPercent(currentValue: number, targetValue: number): number {
  if (targetValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100)));
}

export function deriveAutoGoalStatus(input: {
  status: CreatorGoalStatus;
  currentValue: number;
  targetValue: number;
  periodEnd: Date;
  now?: Date;
}): CreatorGoalStatus {
  if (input.status !== 'ACTIVE') {
    return input.status;
  }

  const now = input.now ?? new Date();

  if (input.currentValue >= input.targetValue) {
    return 'COMPLETED';
  }

  if (now.getTime() > input.periodEnd.getTime()) {
    return 'MISSED';
  }

  return 'ACTIVE';
}

export function formatGoalValue(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function parseGoalValue(value: { toString(): string } | number): number {
  const parsed = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isSessionInGoalPeriod(
  session: { startedAt: Date | null; endedAt: Date | null },
  periodStart: Date,
  periodEnd: Date,
): boolean {
  const timestamp = session.startedAt ?? session.endedAt;
  if (!timestamp) {
    return false;
  }

  const time = timestamp.getTime();
  return time >= periodStart.getTime() && time <= periodEnd.getTime();
}

export type GoalSessionInput = {
  id: string;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  totalGifts: number | null;
  totalGiftValue: { toString(): string } | null;
  status: string;
};

export type GoalGifterStatInput = {
  gifterProfileId: string;
  liveSessionId: string;
  giftCount: number;
  spendingTier: string | null;
};

export type GoalRecalculationInput = {
  goalType: CreatorGoalType;
  targetValue: number;
  periodStart: Date;
  periodEnd: Date;
  sessions: GoalSessionInput[];
  approvedDeliverableCount: number;
  performanceScore: {
    overallScore: number;
    complianceScore: number;
    consistencyScore: number;
    generatedAt: string;
  } | null;
  complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' | null;
  gifterStats: GoalGifterStatInput[];
};

export type GoalRecalculationResult = {
  currentValue: number;
  calculationSummary: Record<string, unknown>;
};

export function recalculateCreatorGoalValue(
  input: GoalRecalculationInput,
): GoalRecalculationResult {
  const sessionsInPeriod = input.sessions.filter((session) =>
    isSessionInGoalPeriod(session, input.periodStart, input.periodEnd),
  );

  switch (input.goalType) {
    case 'LIVE_HOURS': {
      const totalSeconds = sessionsInPeriod.reduce(
        (sum, session) => sum + (session.durationSeconds ?? 0),
        0,
      );
      const hours = totalSeconds / 3600;
      return {
        currentValue: hours,
        calculationSummary: {
          source: 'live_sessions',
          sessionsCounted: sessionsInPeriod.length,
          totalDurationSeconds: totalSeconds,
          note: 'Live hours are derived from session duration within the goal period.',
        },
      };
    }
    case 'LIVE_DAYS': {
      const days = new Set(
        sessionsInPeriod
          .map((session) => (session.startedAt ?? session.endedAt)?.toISOString().slice(0, 10))
          .filter((value): value is string => Boolean(value)),
      );
      return {
        currentValue: days.size,
        calculationSummary: {
          source: 'live_sessions',
          sessionsCounted: sessionsInPeriod.length,
          distinctLiveDays: days.size,
          note: 'Live days count distinct session dates within the goal period.',
        },
      };
    }
    case 'DIAMONDS': {
      const diamonds = sessionsInPeriod.reduce(
        (sum, session) => sum + (session.totalGifts ?? 0),
        0,
      );
      return {
        currentValue: diamonds,
        calculationSummary: {
          source: 'live_sessions',
          sessionsCounted: sessionsInPeriod.length,
          totalGifts: diamonds,
          note: 'Diamonds use aggregated session gift counts within the goal period.',
        },
      };
    }
    case 'GIFT_VALUE': {
      const giftValue = sessionsInPeriod.reduce(
        (sum, session) =>
          sum + (session.totalGiftValue ? Number(session.totalGiftValue.toString()) : 0),
        0,
      );
      return {
        currentValue: giftValue,
        calculationSummary: {
          source: 'live_sessions',
          sessionsCounted: sessionsInPeriod.length,
          totalGiftValue: giftValue,
          note: 'Gift value sums session gift totals within the goal period.',
        },
      };
    }
    case 'CAMPAIGN_DELIVERABLES':
      return {
        currentValue: input.approvedDeliverableCount,
        calculationSummary: {
          source: 'campaign_creator_deliverables',
          approvedDeliverables: input.approvedDeliverableCount,
          note: 'Campaign deliverables count approved creator deliverables submitted within the goal period.',
        },
      };
    case 'PERFORMANCE_SCORE': {
      const score =
        input.performanceScore &&
        new Date(input.performanceScore.generatedAt).getTime() >= input.periodStart.getTime() &&
        new Date(input.performanceScore.generatedAt).getTime() <= input.periodEnd.getTime()
          ? input.performanceScore.overallScore
          : (input.performanceScore?.overallScore ?? 0);
      return {
        currentValue: score,
        calculationSummary: {
          source: 'creator_performance_score',
          overallScore: score,
          generatedAt: input.performanceScore?.generatedAt ?? null,
          note: 'Performance score uses stored creator performance score when available.',
        },
      };
    }
    case 'COMPLIANCE': {
      const complianceScore =
        input.performanceScore?.complianceScore ??
        (input.complianceStatus === 'COMPLIANT'
          ? 92
          : input.complianceStatus === 'AT_RISK'
            ? 58
            : input.complianceStatus === 'NON_COMPLIANT'
              ? 15
              : 0);
      return {
        currentValue: complianceScore,
        calculationSummary: {
          source: 'compliance_signals',
          complianceScore,
          complianceStatus: input.complianceStatus,
          note: 'Compliance score is derived from stored compliance and performance signals.',
        },
      };
    }
    case 'WHALE_RETENTION': {
      const sessionIds = new Set(sessionsInPeriod.map((session) => session.id));
      const whaleCounts = new Map<string, number>();
      for (const stat of input.gifterStats) {
        if (!sessionIds.has(stat.liveSessionId) || stat.spendingTier !== 'WHALE') {
          continue;
        }
        whaleCounts.set(stat.gifterProfileId, (whaleCounts.get(stat.gifterProfileId) ?? 0) + 1);
      }
      const retainedWhales = [...whaleCounts.values()].filter((count) => count >= 2).length;
      return {
        currentValue: retainedWhales,
        calculationSummary: {
          source: 'gifter_session_stats',
          retainedWhales,
          note: 'Whale retention counts WHALE-tier gifters appearing in two or more sessions within the goal period.',
        },
      };
    }
    case 'REPEAT_GIFTERS': {
      const sessionIds = new Set(sessionsInPeriod.map((session) => session.id));
      const gifterCounts = new Map<string, number>();
      for (const stat of input.gifterStats) {
        if (!sessionIds.has(stat.liveSessionId)) {
          continue;
        }
        gifterCounts.set(stat.gifterProfileId, (gifterCounts.get(stat.gifterProfileId) ?? 0) + 1);
      }
      const repeatGifters = [...gifterCounts.values()].filter((count) => count >= 2).length;
      return {
        currentValue: repeatGifters,
        calculationSummary: {
          source: 'gifter_session_stats',
          repeatGifters,
          note: 'Repeat gifters count gifters appearing in two or more sessions within the goal period.',
        },
      };
    }
    case 'CONSISTENCY_SCORE': {
      const score = input.performanceScore?.consistencyScore ?? 0;
      return {
        currentValue: score,
        calculationSummary: {
          source: 'creator_performance_score',
          consistencyScore: score,
          generatedAt: input.performanceScore?.generatedAt ?? null,
          note: 'Consistency score uses stored creator performance score when available.',
        },
      };
    }
    default:
      return {
        currentValue: 0,
        calculationSummary: {
          source: 'unknown',
          note: 'Unsupported goal type.',
        },
      };
  }
}
