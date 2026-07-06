import type {
  CreatorLead,
  LeadDetails,
  LeadPlatformAccount,
  RecruiterProfileSummary,
} from '@kolab/types';

import {
  buildProspectPipeline,
  buildRecruiterPerformance,
  buildRecruitingOverview,
  groupFollowUpQueue,
  mapProspectDetail,
  mapProspectListItem,
} from '@/types/recruiting-adapters';
import type { ManagerRecruitingWorkspace } from '@/types/recruiting-workspace';

const now = new Date();
const iso = (offsetDays: number, hour = 10) => {
  const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const MOCK_PROSPECT_PRIMARY = 'lead_mock_001';

const RECRUITER_USER_001 = 'user_recruiter_001';
const RECRUITER_USER_002 = 'user_recruiter_002';

const mockRecruiters: RecruiterProfileSummary[] = [
  {
    id: 'recruiter_profile_001',
    organizationId: 'org_mock_001',
    userId: RECRUITER_USER_001,
    displayName: 'Jordan Lee',
    nickname: 'Jordan',
    territory: 'West Coast',
    status: 'ACTIVE',
    managerUserId: 'user_manager_001',
    commissionPlan: 'STANDARD',
    monthlyLeadGoal: 40,
    monthlyCreatorGoal: 8,
  },
  {
    id: 'recruiter_profile_002',
    organizationId: 'org_mock_001',
    userId: RECRUITER_USER_002,
    displayName: 'Priya Shah',
    nickname: 'Priya',
    territory: 'National',
    status: 'ACTIVE',
    managerUserId: 'user_manager_001',
    commissionPlan: 'PREMIUM',
    monthlyLeadGoal: 35,
    monthlyCreatorGoal: 10,
  },
];

function createLeads(): CreatorLead[] {
  return [
    {
      id: MOCK_PROSPECT_PRIMARY,
      organizationId: 'org_mock_001',
      name: 'Alex Rivera',
      nickname: 'alexlive',
      email: 'alex@example.com',
      phone: '+1 555 0101',
      country: 'US',
      languages: ['en', 'es'],
      source: 'SOCIAL',
      status: 'INTERESTED',
      score: 82,
      assignedRecruiterId: RECRUITER_USER_001,
      assignedAt: iso(-5),
      nextFollowUpAt: iso(0, 14),
      commissionPlan: 'STANDARD',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: 'Strong TikTok presence in beauty niche.',
      metadata: { tags: ['beauty', 'priority'] },
      createdAt: iso(-10),
      updatedAt: iso(-1),
    },
    {
      id: 'lead_mock_002',
      organizationId: 'org_mock_001',
      name: 'Maya Chen',
      nickname: 'mayacreates',
      email: 'maya@example.com',
      phone: '+1 555 0102',
      country: 'US',
      languages: ['en'],
      source: 'REFERRAL',
      status: 'NEW',
      score: 68,
      assignedRecruiterId: null,
      assignedAt: null,
      nextFollowUpAt: null,
      commissionPlan: 'STANDARD',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: null,
      metadata: { tags: ['gaming'] },
      createdAt: iso(-2),
      updatedAt: iso(-2),
    },
    {
      id: 'lead_mock_003',
      organizationId: 'org_mock_001',
      name: 'Sam Ortiz',
      nickname: 'samstreams',
      email: 'sam@example.com',
      phone: '+1 555 0103',
      country: 'MX',
      languages: ['es', 'en'],
      source: 'EVENT',
      status: 'CONTACTED',
      score: 74,
      assignedRecruiterId: RECRUITER_USER_002,
      assignedAt: iso(-4),
      nextFollowUpAt: iso(-1, 9),
      commissionPlan: 'PREMIUM',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: 'Met at creator summit.',
      metadata: { tags: ['live'] },
      createdAt: iso(-8),
      updatedAt: iso(-1),
    },
    {
      id: 'lead_mock_004',
      organizationId: 'org_mock_001',
      name: 'Jordan Blake',
      nickname: 'jblake',
      email: 'jordan@example.com',
      phone: '+1 555 0104',
      country: 'CA',
      languages: ['en', 'fr'],
      source: 'MANUAL',
      status: 'APPLICATION',
      score: 88,
      assignedRecruiterId: RECRUITER_USER_001,
      assignedAt: iso(-12),
      nextFollowUpAt: iso(1, 11),
      commissionPlan: 'STANDARD',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: 'Application submitted with portfolio links.',
      metadata: { tags: ['fitness'] },
      createdAt: iso(-20),
      updatedAt: iso(-3),
    },
    {
      id: 'lead_mock_005',
      organizationId: 'org_mock_001',
      name: 'Taylor Brooks',
      nickname: 'taylorb',
      email: 'taylor@example.com',
      phone: '+1 555 0105',
      country: 'US',
      languages: ['en'],
      source: 'IMPORT',
      status: 'CONTRACT_SENT',
      score: 91,
      assignedRecruiterId: RECRUITER_USER_002,
      assignedAt: iso(-15),
      nextFollowUpAt: iso(2, 15),
      commissionPlan: 'PREMIUM',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: 'Contract sent — awaiting signature.',
      metadata: { tags: ['fashion'] },
      createdAt: iso(-25),
      updatedAt: iso(-2),
    },
    {
      id: 'lead_mock_006',
      organizationId: 'org_mock_001',
      name: 'Riley Nguyen',
      nickname: 'rileyn',
      email: 'riley@example.com',
      phone: '+1 555 0106',
      country: 'US',
      languages: ['en', 'vi'],
      source: 'SOCIAL',
      status: 'SIGNED',
      score: 95,
      assignedRecruiterId: RECRUITER_USER_001,
      assignedAt: iso(-30),
      nextFollowUpAt: null,
      commissionPlan: 'STANDARD',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: 'Signed last week.',
      metadata: { tags: ['tech'] },
      createdAt: iso(-40),
      updatedAt: iso(-7),
    },
    {
      id: 'lead_mock_007',
      organizationId: 'org_mock_001',
      name: 'Casey Morgan',
      nickname: 'caseym',
      email: 'casey@example.com',
      phone: '+1 555 0107',
      country: 'US',
      languages: ['en'],
      source: 'OTHER',
      status: 'REJECTED',
      score: 42,
      assignedRecruiterId: RECRUITER_USER_002,
      assignedAt: iso(-18),
      nextFollowUpAt: null,
      commissionPlan: 'STANDARD',
      convertedUserId: null,
      convertedAt: null,
      notesSummary: 'Not a fit for current campaigns.',
      metadata: { tags: [] },
      createdAt: iso(-22),
      updatedAt: iso(-10),
    },
    {
      id: 'lead_mock_008',
      organizationId: 'org_mock_001',
      name: 'Drew Patel',
      nickname: 'drewp',
      email: 'drew@example.com',
      phone: '+1 555 0108',
      country: 'US',
      languages: ['en', 'hi'],
      source: 'REFERRAL',
      status: 'ACTIVE_CREATOR',
      score: 97,
      assignedRecruiterId: RECRUITER_USER_001,
      assignedAt: iso(-60),
      nextFollowUpAt: null,
      commissionPlan: 'PREMIUM',
      convertedUserId: 'user_creator_001',
      convertedAt: iso(-14),
      notesSummary: 'Converted to creator profile.',
      metadata: { tags: ['converted'] },
      createdAt: iso(-90),
      updatedAt: iso(-14),
    },
  ];
}

const mockPlatformAccounts: LeadPlatformAccount[] = [
  {
    id: 'lead_platform_001',
    organizationId: 'org_mock_001',
    leadId: MOCK_PROSPECT_PRIMARY,
    platform: 'TIKTOK',
    username: 'alexlive',
    profileUrl: 'https://tiktok.com/@alexlive',
    followers: 245000,
    verified: true,
    status: 'ACTIVE',
    metadata: {},
    createdAt: iso(-10),
    updatedAt: iso(-10),
  },
  {
    id: 'lead_platform_002',
    organizationId: 'org_mock_001',
    leadId: MOCK_PROSPECT_PRIMARY,
    platform: 'INSTAGRAM',
    username: 'alexlive',
    profileUrl: 'https://instagram.com/alexlive',
    followers: 82000,
    verified: false,
    status: 'ACTIVE',
    metadata: {},
    createdAt: iso(-10),
    updatedAt: iso(-10),
  },
];

function buildMockLeadDetails(lead: CreatorLead): LeadDetails {
  return {
    ...lead,
    platformAccounts: mockPlatformAccounts.filter((account) => account.leadId === lead.id),
    assignments: lead.assignedRecruiterId
      ? [
          {
            id: `assign_${lead.id}`,
            organizationId: lead.organizationId,
            leadId: lead.id,
            recruiterId: lead.assignedRecruiterId,
            assignedById: 'user_manager_001',
            assignedAt: lead.assignedAt ?? lead.createdAt,
            unassignedAt: null,
            reason: 'Initial assignment',
            createdAt: lead.assignedAt ?? lead.createdAt,
          },
        ]
      : [],
    notes: [
      {
        id: `note_${lead.id}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        authorId: lead.assignedRecruiterId ?? 'user_manager_001',
        contactType: 'EMAIL',
        note: lead.notesSummary ?? 'Initial outreach completed.',
        createdAt: iso(-3),
      },
    ],
    statusHistory: [
      {
        id: `history_${lead.id}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        previousStatus: 'NEW',
        newStatus: lead.status === 'NEW' ? 'NEW' : 'CONTACTED',
        changedById: lead.assignedRecruiterId ?? 'user_manager_001',
        changedAt: iso(-6),
        reason: 'Pipeline update',
      },
      ...(lead.status !== 'NEW' && lead.status !== 'CONTACTED'
        ? [
            {
              id: `history_${lead.id}_2`,
              organizationId: lead.organizationId,
              leadId: lead.id,
              previousStatus: 'CONTACTED' as const,
              newStatus: lead.status,
              changedById: lead.assignedRecruiterId ?? 'user_manager_001',
              changedAt: iso(-2),
              reason: 'Status progression',
            },
          ]
        : []),
    ],
  };
}

export function createMockRecruitingWorkspace(organizationId: string): ManagerRecruitingWorkspace {
  const leads = createLeads();
  const recruiterNames = new Map(
    mockRecruiters.map((recruiter) => [
      recruiter.userId,
      recruiter.displayName ?? recruiter.nickname ?? recruiter.userId,
    ]),
  );

  const prospects = leads
    .filter((lead) => !['ACTIVE_CREATOR', 'INACTIVE'].includes(lead.status))
    .map((lead) => mapProspectListItem(lead, recruiterNames));

  const primaryLead = leads.find((lead) => lead.id === MOCK_PROSPECT_PRIMARY)!;
  const detail = mapProspectDetail(buildMockLeadDetails(primaryLead), recruiterNames);

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    overview: buildRecruitingOverview(prospects),
    prospects,
    pipeline: buildProspectPipeline(prospects),
    detail,
    followUpQueue: groupFollowUpQueue(prospects),
    recruiterPerformance: buildRecruiterPerformance(prospects, mockRecruiters),
    selectedProspectId: MOCK_PROSPECT_PRIMARY,
  };
}

export function getMockProspectDetail(prospectId: string) {
  const lead = createLeads().find((item) => item.id === prospectId);
  if (!lead) return null;

  const recruiterNames = new Map(
    mockRecruiters.map((recruiter) => [
      recruiter.userId,
      recruiter.displayName ?? recruiter.nickname ?? recruiter.userId,
    ]),
  );

  return mapProspectDetail(buildMockLeadDetails(lead), recruiterNames);
}

export { mockRecruiters };
