import type { LeadDetails, LeadStatus, LeadSummary, RecruiterProfileSummary } from '@kolab/types';

import type {
  ManagerFollowUpQueue,
  ManagerFollowUpQueueItem,
  ManagerProspectBoardItem,
  ManagerProspectDetail,
  ManagerProspectListItem,
  ManagerProspectPipeline,
  ManagerRecruiterPerformance,
  ManagerRecruitingOverview,
  ProspectPipelineColumn,
} from '@/types/recruiting-workspace';

const ACTIVE_CONVERSATION_STATUSES: LeadStatus[] = [
  'CONTACTED',
  'INTERESTED',
  'APPLICATION',
  'CONTRACT_SENT',
];

const SIGNED_STATUSES: LeadStatus[] = ['SIGNED', 'ACTIVE_CREATOR'];

export function buildRecruiterNameMap(recruiters: RecruiterProfileSummary[]): Map<string, string> {
  return new Map(
    recruiters.map((recruiter) => [
      recruiter.userId,
      recruiter.displayName ?? recruiter.nickname ?? recruiter.userId,
    ]),
  );
}

export function mapPipelineColumn(status: LeadStatus): ProspectPipelineColumn | null {
  switch (status) {
    case 'NEW':
      return 'new';
    case 'CONTACTED':
      return 'contacted';
    case 'INTERESTED':
      return 'interested';
    case 'APPLICATION':
      return 'interview';
    case 'CONTRACT_SENT':
      return 'pending';
    case 'SIGNED':
      return 'signed';
    case 'REJECTED':
      return 'declined';
    case 'ACTIVE_CREATOR':
    case 'INACTIVE':
      return null;
    default:
      return null;
  }
}

function formatPlatformLabel(lead: LeadSummary): string | null {
  const metadata = lead as LeadSummary & { platformAccounts?: Array<{ platform: string }> };
  const platform = metadata.platformAccounts?.[0]?.platform;
  return platform ?? null;
}

export function mapProspectListItem(
  lead: LeadSummary,
  recruiterNames: Map<string, string>,
): ManagerProspectListItem {
  const pipelineColumn = mapPipelineColumn(lead.status) ?? 'new';

  return {
    id: lead.id,
    name: lead.name,
    nickname: lead.nickname,
    status: lead.status,
    source: lead.source,
    score: lead.score,
    pipelineColumn,
    assignedRecruiterId: lead.assignedRecruiterId,
    assignedRecruiterName: lead.assignedRecruiterId
      ? (recruiterNames.get(lead.assignedRecruiterId) ?? lead.assignedRecruiterId)
      : null,
    nextFollowUpAt: lead.nextFollowUpAt,
    platformLabel: formatPlatformLabel(lead),
  };
}

export function mapProspectBoardItem(prospect: ManagerProspectListItem): ManagerProspectBoardItem {
  return {
    id: prospect.id,
    name: prospect.name,
    status: prospect.status,
    score: prospect.score,
    assignedRecruiterName: prospect.assignedRecruiterName,
    nextFollowUpAt: prospect.nextFollowUpAt,
  };
}

export function buildProspectPipeline(
  prospects: ManagerProspectListItem[],
): ManagerProspectPipeline {
  const pipeline: ManagerProspectPipeline = {
    new: [],
    contacted: [],
    interested: [],
    interview: [],
    pending: [],
    signed: [],
    declined: [],
  };

  for (const prospect of prospects) {
    pipeline[prospect.pipelineColumn].push(mapProspectBoardItem(prospect));
  }

  return pipeline;
}

export function buildRecruitingOverview(
  prospects: ManagerProspectListItem[],
): ManagerRecruitingOverview {
  const newLeads = prospects.filter((prospect) => prospect.status === 'NEW').length;
  const activeConversations = prospects.filter((prospect) =>
    ACTIVE_CONVERSATION_STATUSES.includes(prospect.status as LeadStatus),
  ).length;
  const pendingFollowUps = prospects.filter((prospect) => Boolean(prospect.nextFollowUpAt)).length;
  const signedCreators = prospects.filter((prospect) =>
    SIGNED_STATUSES.includes(prospect.status as LeadStatus),
  ).length;

  const funnelStages = [
    prospects.filter((prospect) => prospect.pipelineColumn === 'new').length,
    prospects.filter((prospect) => prospect.pipelineColumn === 'contacted').length,
    prospects.filter((prospect) => prospect.pipelineColumn === 'interested').length,
    prospects.filter((prospect) => prospect.pipelineColumn === 'interview').length,
    prospects.filter((prospect) => prospect.pipelineColumn === 'pending').length,
    prospects.filter((prospect) => prospect.pipelineColumn === 'signed').length,
  ];

  return {
    totalProspects: prospects.length,
    newLeads,
    activeConversations,
    pendingFollowUps,
    signedCreators,
    conversionFunnel: funnelStages.join(' → '),
  };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function bucketFollowUpAt(
  nextFollowUpAt: string,
  now = new Date(),
): ManagerFollowUpQueueItem['bucket'] {
  const followUp = new Date(nextFollowUpAt);
  if (followUp.getTime() < startOfDay(now).getTime()) return 'overdue';
  if (followUp.getTime() <= endOfDay(now).getTime()) return 'today';
  return 'upcoming';
}

export function groupFollowUpQueue(prospects: ManagerProspectListItem[]): ManagerFollowUpQueue {
  const queue: ManagerFollowUpQueue = {
    overdue: [],
    today: [],
    upcoming: [],
  };

  for (const prospect of prospects) {
    if (!prospect.nextFollowUpAt) continue;

    const item: ManagerFollowUpQueueItem = {
      id: prospect.id,
      prospectName: prospect.name,
      assignedRecruiterName: prospect.assignedRecruiterName,
      status: prospect.status,
      nextFollowUpAt: prospect.nextFollowUpAt,
      bucket: bucketFollowUpAt(prospect.nextFollowUpAt),
    };

    queue[item.bucket].push(item);
  }

  for (const bucket of Object.keys(queue) as Array<keyof ManagerFollowUpQueue>) {
    queue[bucket].sort(
      (left, right) =>
        new Date(left.nextFollowUpAt).getTime() - new Date(right.nextFollowUpAt).getTime(),
    );
  }

  return queue;
}

export function buildRecruiterPerformance(
  prospects: ManagerProspectListItem[],
  recruiters: RecruiterProfileSummary[],
): ManagerRecruiterPerformance {
  const recruiterNameMap = buildRecruiterNameMap(recruiters);

  const items = recruiters.map((recruiter) => {
    const recruiterProspects = prospects.filter(
      (prospect) => prospect.assignedRecruiterId === recruiter.userId,
    );

    const contacted = recruiterProspects.filter((prospect) => prospect.status !== 'NEW');
    const responded = recruiterProspects.filter((prospect) =>
      ['INTERESTED', 'APPLICATION', 'CONTRACT_SENT', 'SIGNED', 'ACTIVE_CREATOR'].includes(
        prospect.status,
      ),
    );
    const signed = recruiterProspects.filter((prospect) =>
      SIGNED_STATUSES.includes(prospect.status as LeadStatus),
    );
    const activeWorkload = recruiterProspects.filter(
      (prospect) => !['REJECTED', 'INACTIVE'].includes(prospect.status),
    ).length;

    const responseRate =
      contacted.length === 0 ? 0 : Math.round((responded.length / contacted.length) * 100);
    const conversionRate =
      recruiterProspects.length === 0
        ? 0
        : Math.round((signed.length / recruiterProspects.length) * 100);

    return {
      recruiterId: recruiter.id,
      recruiterName: recruiterNameMap.get(recruiter.userId) ?? recruiter.userId,
      leadsContacted: contacted.length,
      responseRateLabel: `${responseRate}%`,
      conversionRateLabel: `${conversionRate}%`,
      signedCreators: signed.length,
      activeWorkload,
    };
  });

  return { items };
}

function formatAudience(platformAccounts: LeadDetails['platformAccounts']): string {
  const followers = platformAccounts
    .map((account) => account.followers)
    .filter((value): value is number => value !== null);

  if (followers.length === 0) return '—';
  const total = followers.reduce((sum, value) => sum + value, 0);
  return total >= 1_000_000
    ? `${(total / 1_000_000).toFixed(1)}M total`
    : total >= 1_000
      ? `${Math.round(total / 1_000)}K total`
      : `${total} total`;
}

export function mapProspectDetail(
  lead: LeadDetails,
  recruiterNames: Map<string, string>,
): ManagerProspectDetail {
  const tags = Array.isArray(lead.metadata?.tags)
    ? (lead.metadata.tags as unknown[]).filter((tag): tag is string => typeof tag === 'string')
    : [];

  const followUpHistory = [
    ...lead.statusHistory.map((entry) => ({
      id: entry.id,
      label: entry.previousStatus
        ? `${entry.previousStatus} → ${entry.newStatus}`
        : entry.newStatus,
      occurredAt: entry.changedAt,
      note: entry.reason,
    })),
    ...lead.notes.map((note) => ({
      id: note.id,
      label: `${note.contactType} note`,
      occurredAt: note.createdAt,
      note: note.note,
    })),
  ].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );

  const notes = lead.notes.map((note) => ({
    id: note.id,
    content: note.note,
    createdAt: note.createdAt,
  }));

  if (lead.notesSummary) {
    notes.unshift({
      id: `${lead.id}_summary`,
      content: lead.notesSummary,
      createdAt: lead.updatedAt,
    });
  }

  return {
    prospectId: lead.id,
    name: lead.name,
    contactInfo: [
      { label: 'Email', value: lead.email },
      { label: 'Phone', value: lead.phone },
      { label: 'Country', value: lead.country },
      { label: 'Nickname', value: lead.nickname },
    ],
    platforms: lead.platformAccounts.map((account) => ({
      platform: account.platform,
      username: account.username,
      followers: account.followers,
    })),
    audienceLabel: formatAudience(lead.platformAccounts),
    languages: lead.languages,
    notes,
    assignedRecruiterName: lead.assignedRecruiterId
      ? (recruiterNames.get(lead.assignedRecruiterId) ?? lead.assignedRecruiterId)
      : null,
    status: lead.status,
    followUpHistory,
    tags,
    source: lead.source,
  };
}
