import type { AccessTokenPayload } from '@kolab/auth';
import type { CreatorGoal as PrismaCreatorGoal } from '@kolab/database';
import { CreatorGoalStatus, MembershipStatus, Prisma, prisma } from '@kolab/database';
import type {
  CreateCreatorGoalInput,
  CreatorGoalListQuery,
  ListCreatorGoalsResponse,
  RecalculateCreatorGoalProgressResponse,
  UpdateCreatorGoalInput,
  UpdateCreatorGoalStatusInput,
} from '@kolab/types';
import type { CreatorGoal } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCreatorGoal, toCreatorGoalProgress } from './creators-goals.mapper';
import {
  assertAllowedCreatorGoalStatusTransition,
  assertCreatorGoalIsEditable,
  assertCreatorGoalIsRecalculable,
  computeProgressPercent,
  deriveAutoGoalStatus,
  formatGoalValue,
  parseGoalValue,
  recalculateCreatorGoalValue,
} from './creators-goals.utils';
import { parseCreatorPerformanceScore } from './creators-performance-score.utils';

@Injectable()
export class CreatorsGoalsService {
  constructor(private readonly auditService: AuditService) {}

  async listCreatorGoals(
    user: AccessTokenPayload,
    creatorProfileId: string,
    query: CreatorGoalListQuery,
  ): Promise<ListCreatorGoalsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorProfileId);

    const take = query.limit + 1;
    const goals = await prisma.creatorGoal.findMany({
      where: {
        organizationId,
        creatorProfileId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.goalType ? { goalType: query.goalType } : {}),
      },
      orderBy: [{ periodEnd: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = goals.length > query.limit;
    const page = hasMore ? goals.slice(0, query.limit) : goals;

    return {
      items: page.map(toCreatorGoal),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getCreatorGoal(
    user: AccessTokenPayload,
    creatorProfileId: string,
    goalId: string,
  ): Promise<CreatorGoal> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorProfileId);
    const goal = await this.loadCreatorGoal(organizationId, creatorProfileId, goalId);
    return toCreatorGoal(goal);
  }

  async createCreatorGoal(
    user: AccessTokenPayload,
    creatorProfileId: string,
    input: CreateCreatorGoalInput,
  ): Promise<CreatorGoal> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorProfileId);

    const goal = await prisma.creatorGoal.create({
      data: {
        organizationId,
        creatorProfileId,
        goalType: input.goalType,
        status: CreatorGoalStatus.ACTIVE,
        title: input.title ?? null,
        targetValue: new Prisma.Decimal(input.targetValue),
        currentValue: new Prisma.Decimal(0),
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        createdByUserId: user.sub,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_GOAL_CREATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_GOAL,
      targetId: goal.id,
      metadata: {
        creatorProfileId,
        goalType: goal.goalType,
        targetValue: goal.targetValue.toString(),
      },
    });

    return toCreatorGoal(goal);
  }

  async updateCreatorGoal(
    user: AccessTokenPayload,
    creatorProfileId: string,
    goalId: string,
    input: UpdateCreatorGoalInput,
  ): Promise<CreatorGoal> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadCreatorGoal(organizationId, creatorProfileId, goalId);
    assertCreatorGoalIsEditable(existing.status as CreatorGoal['status']);

    const periodStart = input.periodStart ? new Date(input.periodStart) : existing.periodStart;
    const periodEnd = input.periodEnd ? new Date(input.periodEnd) : existing.periodEnd;
    if (periodEnd.getTime() <= periodStart.getTime()) {
      throw new ForbiddenException('periodEnd must be after periodStart');
    }

    const goal = await prisma.creatorGoal.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.targetValue !== undefined
          ? { targetValue: new Prisma.Decimal(input.targetValue) }
          : {}),
        ...(input.periodStart !== undefined ? { periodStart } : {}),
        ...(input.periodEnd !== undefined ? { periodEnd } : {}),
        ...(input.metadata !== undefined
          ? {
              metadata: {
                ...(existing.metadata as Record<string, unknown>),
                ...input.metadata,
              } as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_GOAL_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_GOAL,
      targetId: goal.id,
      metadata: {
        creatorProfileId,
        goalType: goal.goalType,
      },
    });

    return toCreatorGoal(goal);
  }

  async updateCreatorGoalStatus(
    user: AccessTokenPayload,
    creatorProfileId: string,
    goalId: string,
    input: UpdateCreatorGoalStatusInput,
  ): Promise<CreatorGoal> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadCreatorGoal(organizationId, creatorProfileId, goalId);
    assertAllowedCreatorGoalStatusTransition(
      existing.status as CreatorGoal['status'],
      input.status,
    );

    const goal = await prisma.creatorGoal.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        ...(input.metadata !== undefined
          ? {
              metadata: {
                ...(existing.metadata as Record<string, unknown>),
                ...input.metadata,
              } as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_GOAL_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_GOAL,
      targetId: goal.id,
      metadata: {
        creatorProfileId,
        previousStatus: existing.status,
        nextStatus: goal.status,
      },
    });

    return toCreatorGoal(goal);
  }

  async recalculateCreatorGoalProgress(
    user: AccessTokenPayload,
    creatorProfileId: string,
    goalId: string,
  ): Promise<RecalculateCreatorGoalProgressResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadCreatorGoal(organizationId, creatorProfileId, goalId);
    assertCreatorGoalIsRecalculable(existing.status as CreatorGoal['status']);

    const creator = await this.requireCreatorProfile(organizationId, creatorProfileId);
    const recalculation = await this.buildRecalculationContext(
      existing,
      creator.id,
      creator.metadata,
    );
    const targetValue = parseGoalValue(existing.targetValue);
    const nextStatus = deriveAutoGoalStatus({
      status: existing.status as CreatorGoal['status'],
      currentValue: recalculation.currentValue,
      targetValue,
      periodEnd: existing.periodEnd,
    });

    const progressPercent = computeProgressPercent(recalculation.currentValue, targetValue);

    const [goal, progress] = await prisma.$transaction([
      prisma.creatorGoal.update({
        where: { id: existing.id },
        data: {
          currentValue: new Prisma.Decimal(formatGoalValue(recalculation.currentValue)),
          status: nextStatus,
        },
      }),
      prisma.creatorGoalProgress.create({
        data: {
          organizationId,
          creatorGoalId: existing.id,
          currentValue: new Prisma.Decimal(formatGoalValue(recalculation.currentValue)),
          targetValue: existing.targetValue,
          progressPercent,
          calculationSummary: recalculation.calculationSummary as Prisma.InputJsonValue,
        },
      }),
    ]);

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_GOAL_PROGRESS_RECALCULATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_GOAL,
      targetId: goal.id,
      metadata: {
        creatorProfileId,
        goalType: goal.goalType,
        currentValue: goal.currentValue.toString(),
        progressPercent,
        status: goal.status,
      },
    });

    return {
      goal: toCreatorGoal(goal),
      progress: toCreatorGoalProgress(progress),
    };
  }

  private async buildRecalculationContext(
    goal: PrismaCreatorGoal,
    creatorProfileId: string,
    metadata: unknown,
  ) {
    const [sessions, approvedDeliverables, gifterStats, approvedDocuments, signedAgreements] =
      await Promise.all([
        prisma.liveSession.findMany({
          where: {
            organizationId: goal.organizationId,
            creatorProfileId,
            OR: [
              {
                startedAt: {
                  gte: goal.periodStart,
                  lte: goal.periodEnd,
                },
              },
              {
                endedAt: {
                  gte: goal.periodStart,
                  lte: goal.periodEnd,
                },
              },
            ],
          },
          select: {
            id: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            totalGifts: true,
            totalGiftValue: true,
            status: true,
          },
        }),
        prisma.campaignCreatorDeliverable.count({
          where: {
            organizationId: goal.organizationId,
            status: 'APPROVED',
            approvedAt: {
              gte: goal.periodStart,
              lte: goal.periodEnd,
            },
            assignment: {
              creatorProfileId,
            },
          },
        }),
        prisma.gifterSessionStats.findMany({
          where: {
            organizationId: goal.organizationId,
            creatorProfileId,
            OR: [
              {
                firstGiftAt: {
                  gte: goal.periodStart,
                  lte: goal.periodEnd,
                },
              },
              {
                lastGiftAt: {
                  gte: goal.periodStart,
                  lte: goal.periodEnd,
                },
              },
            ],
          },
          select: {
            gifterProfileId: true,
            liveSessionId: true,
            giftCount: true,
            gifterProfile: {
              select: {
                spendingTier: true,
              },
            },
          },
        }),
        prisma.creatorDocument.findMany({
          where: {
            organizationId: goal.organizationId,
            creatorProfileId,
            deletedAt: null,
            status: 'APPROVED',
            documentType: 'GOVERNMENT_ID',
          },
          select: { id: true },
        }),
        prisma.creatorContract.findMany({
          where: {
            organizationId: goal.organizationId,
            creatorProfileId,
            deletedAt: null,
            contractType: 'CREATOR_AGREEMENT',
            status: 'SIGNED',
          },
          select: { id: true },
        }),
      ]);

    const performanceScore = parseCreatorPerformanceScore(creatorProfileId, metadata);
    const complianceStatus = this.deriveComplianceStatus({
      performanceScore,
      hasApprovedGovernmentId: approvedDocuments.length > 0,
      hasSignedAgreement: signedAgreements.length > 0,
    });

    const result = recalculateCreatorGoalValue({
      goalType: goal.goalType as CreatorGoal['goalType'],
      targetValue: parseGoalValue(goal.targetValue),
      periodStart: goal.periodStart,
      periodEnd: goal.periodEnd,
      sessions,
      approvedDeliverableCount: approvedDeliverables,
      performanceScore: performanceScore
        ? {
            overallScore: performanceScore.overallScore,
            complianceScore: performanceScore.complianceScore,
            consistencyScore: performanceScore.consistencyScore,
            generatedAt: performanceScore.generatedAt,
          }
        : null,
      complianceStatus,
      gifterStats: gifterStats.map((stat) => ({
        gifterProfileId: stat.gifterProfileId,
        liveSessionId: stat.liveSessionId,
        giftCount: stat.giftCount,
        spendingTier: stat.gifterProfile.spendingTier,
      })),
    });

    return result;
  }

  private deriveComplianceStatus(input: {
    performanceScore: ReturnType<typeof parseCreatorPerformanceScore>;
    hasApprovedGovernmentId: boolean;
    hasSignedAgreement: boolean;
  }) {
    if (input.performanceScore) {
      if (input.performanceScore.complianceScore <= 20) {
        return 'NON_COMPLIANT' as const;
      }
      if (input.performanceScore.complianceScore <= 60) {
        return 'AT_RISK' as const;
      }
      return 'COMPLIANT' as const;
    }

    if (!input.hasApprovedGovernmentId || !input.hasSignedAgreement) {
      return 'NON_COMPLIANT' as const;
    }

    return 'AT_RISK' as const;
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.sub,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }

    return user.organizationId;
  }

  private async requireCreatorProfile(organizationId: string, creatorProfileId: string) {
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        id: creatorProfileId,
        organizationId,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return creator;
  }

  private async loadCreatorGoal(
    organizationId: string,
    creatorProfileId: string,
    goalId: string,
  ): Promise<PrismaCreatorGoal> {
    const goal = await prisma.creatorGoal.findFirst({
      where: {
        id: goalId,
        organizationId,
        creatorProfileId,
      },
    });

    if (!goal) {
      throw new NotFoundException('Creator goal not found');
    }

    return goal;
  }
}
