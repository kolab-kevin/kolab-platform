import type { CampaignDeliverableStatus, CampaignStatus, CampaignType } from '@kolab/types';
import { BadRequestException } from '@nestjs/common';

const CAMPAIGN_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: [],
};

const DELIVERABLE_STATUS_TRANSITIONS: Record<
  CampaignDeliverableStatus,
  CampaignDeliverableStatus[]
> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
  APPROVED: [],
  REJECTED: ['IN_PROGRESS', 'CANCELLED'],
  CANCELLED: [],
};

export function toMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

export function assertAllowedCampaignStatusTransition(
  currentStatus: CampaignStatus,
  nextStatus: CampaignStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Campaign status is already set to the requested value');
  }

  const allowed = CAMPAIGN_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition campaign status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertAllowedDeliverableStatusTransition(
  currentStatus: CampaignDeliverableStatus,
  nextStatus: CampaignDeliverableStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Deliverable status is already set to the requested value');
  }

  const allowed = DELIVERABLE_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition deliverable status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertCampaignIsEditable(
  status: CampaignStatus,
  input: {
    title?: string;
    description?: string | null;
    brandName?: string | null;
    campaignType?: CampaignType;
    budgetAmount?: number | null;
    budgetCurrency?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    applicationDeadline?: string | null;
    brief?: Record<string, unknown>;
    requirements?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
): void {
  if (status === 'ARCHIVED') {
    throw new BadRequestException('Archived campaigns cannot be modified');
  }

  if (status === 'COMPLETED' || status === 'CANCELLED') {
    const hasNonMetadataUpdate = Object.entries(input).some(
      ([key, value]) => key !== 'metadata' && value !== undefined,
    );

    if (hasNonMetadataUpdate) {
      throw new BadRequestException('Completed or cancelled campaigns only allow metadata updates');
    }

    if (input.metadata === undefined) {
      throw new BadRequestException('Completed or cancelled campaigns only allow metadata updates');
    }
  }
}

export function assertDeliverableIsEditable(status: CampaignDeliverableStatus): void {
  if (status === 'APPROVED' || status === 'CANCELLED') {
    throw new BadRequestException('Deliverable cannot be modified in the current status');
  }
}

export function assertDeliverablesAllowedForCampaign(status: CampaignStatus): void {
  if (status === 'ARCHIVED' || status === 'CANCELLED') {
    throw new BadRequestException(
      'Deliverables cannot be added to archived or cancelled campaigns',
    );
  }
}

export const ACTIVE_CAMPAIGN_APPLICATION_STATUSES = ['INVITED', 'APPLIED'] as const;

export type ActiveCampaignApplicationStatus = (typeof ACTIVE_CAMPAIGN_APPLICATION_STATUSES)[number];

export type CampaignApplicationStatus =
  'INVITED' | 'APPLIED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'CANCELLED';

const APPLICATION_STATUS_TRANSITIONS: Record<
  CampaignApplicationStatus,
  CampaignApplicationStatus[]
> = {
  INVITED: ['APPLIED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  APPLIED: ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
  CANCELLED: [],
};

export function assertAllowedApplicationStatusTransition(
  currentStatus: CampaignApplicationStatus,
  nextStatus: CampaignApplicationStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Application status is already set to the requested value');
  }

  const allowed = APPLICATION_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition application status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertApplicationsAllowedForCampaign(status: CampaignStatus): void {
  if (status === 'ARCHIVED' || status === 'CANCELLED' || status === 'COMPLETED') {
    throw new BadRequestException(
      'Applications cannot be submitted to archived, cancelled, or completed campaigns',
    );
  }
}

export function isActiveApplicationStatus(status: CampaignApplicationStatus): boolean {
  return (ACTIVE_CAMPAIGN_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export const ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] as const;

export type ActiveCampaignAssignmentStatus = (typeof ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES)[number];

export type CampaignAssignmentStatus =
  'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type CampaignCreatorDeliverableStatus =
  'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const ASSIGNMENT_STATUS_TRANSITIONS: Record<CampaignAssignmentStatus, CampaignAssignmentStatus[]> =
  {
    ASSIGNED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

const CREATOR_DELIVERABLE_STATUS_TRANSITIONS: Record<
  CampaignCreatorDeliverableStatus,
  CampaignCreatorDeliverableStatus[]
> = {
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
  APPROVED: [],
  REJECTED: ['IN_PROGRESS', 'CANCELLED'],
  CANCELLED: [],
};

export function assertAllowedAssignmentStatusTransition(
  currentStatus: CampaignAssignmentStatus,
  nextStatus: CampaignAssignmentStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Assignment status is already set to the requested value');
  }

  const allowed = ASSIGNMENT_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition assignment status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertAllowedCreatorDeliverableStatusTransition(
  currentStatus: CampaignCreatorDeliverableStatus,
  nextStatus: CampaignCreatorDeliverableStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException(
      'Creator deliverable status is already set to the requested value',
    );
  }

  const allowed = CREATOR_DELIVERABLE_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition creator deliverable status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertAssignmentsAllowedForCampaign(status: CampaignStatus): void {
  if (status === 'ARCHIVED' || status === 'CANCELLED' || status === 'COMPLETED') {
    throw new BadRequestException(
      'Assignments cannot be created for archived, cancelled, or completed campaigns',
    );
  }
}

export function assertCreatorDeliverableIsEditable(status: CampaignCreatorDeliverableStatus): void {
  if (status === 'APPROVED' || status === 'CANCELLED') {
    throw new BadRequestException('Creator deliverable cannot be modified in the current status');
  }
}

export function assertCreatorDeliverablesAllowedForAssignment(
  status: CampaignAssignmentStatus,
): void {
  if (status === 'CANCELLED' || status === 'COMPLETED') {
    throw new BadRequestException(
      'Creator deliverables cannot be added to cancelled or completed assignments',
    );
  }
}
