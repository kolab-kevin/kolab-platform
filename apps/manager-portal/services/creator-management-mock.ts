import type {
  ManagerCreatorDetail,
  ManagerCreatorListItem,
  ManagerCreatorManagementWorkspace,
} from '@/types/creator-management';

const now = new Date();
const iso = (offsetMinutes: number) =>
  new Date(now.getTime() + offsetMinutes * 60 * 1000).toISOString();

const MOCK_CREATORS: ManagerCreatorListItem[] = [
  {
    id: 'creator_mock_001',
    displayName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    country: 'US',
    languages: ['en', 'es'],
    status: 'ACTIVE',
    onboardingStatus: 'INCOMPLETE',
    complianceStatus: 'AT_RISK',
    intelligenceScore: 75,
    performanceScore: 82,
    performanceBand: 'STRONG',
    latestActivity: 'Live session ended 2h ago',
    managerName: 'Jordan Lee',
    platformBadges: ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'],
    updatedAt: iso(-120),
  },
  {
    id: 'creator_mock_002',
    displayName: 'Maya Chen',
    email: 'maya.chen@example.com',
    country: 'CA',
    languages: ['en', 'zh'],
    status: 'ACTIVE',
    onboardingStatus: 'COMPLETE',
    complianceStatus: 'COMPLIANT',
    intelligenceScore: 88,
    performanceScore: 91,
    performanceBand: 'EXCELLENT',
    latestActivity: 'Deliverable submitted 5h ago',
    managerName: 'Jordan Lee',
    platformBadges: ['TIKTOK', 'INSTAGRAM'],
    updatedAt: iso(-300),
  },
  {
    id: 'creator_mock_003',
    displayName: 'Sam Ortiz',
    email: 'sam.ortiz@example.com',
    country: 'MX',
    languages: ['es', 'en'],
    status: 'ACTIVE',
    onboardingStatus: 'WARNING',
    complianceStatus: 'AT_RISK',
    intelligenceScore: 62,
    performanceScore: 58,
    performanceBand: 'DEVELOPING',
    latestActivity: 'Coach alert acknowledged 1d ago',
    managerName: 'Taylor Brooks',
    platformBadges: ['TIKTOK'],
    updatedAt: iso(-60 * 24),
  },
  {
    id: 'creator_mock_004',
    displayName: 'Priya Nair',
    email: 'priya.nair@example.com',
    country: 'IN',
    languages: ['en', 'hi'],
    status: 'SUSPENDED',
    onboardingStatus: 'COMPLETE',
    complianceStatus: 'BLOCKED',
    intelligenceScore: 54,
    performanceScore: 49,
    performanceBand: 'AT_RISK',
    latestActivity: 'Compliance review pending',
    managerName: 'Taylor Brooks',
    platformBadges: ['YOUTUBE', 'INSTAGRAM'],
    updatedAt: iso(-60 * 24 * 2),
  },
  {
    id: 'creator_mock_005',
    displayName: 'Jordan Blake',
    email: 'jordan.blake@example.com',
    country: 'UK',
    languages: ['en'],
    status: 'ACTIVE',
    onboardingStatus: 'INCOMPLETE',
    complianceStatus: 'COMPLIANT',
    intelligenceScore: 71,
    performanceScore: 74,
    performanceBand: 'STRONG',
    latestActivity: 'Campaign application submitted',
    managerName: 'Jordan Lee',
    platformBadges: ['TWITCH', 'TIKTOK'],
    updatedAt: iso(-60 * 12),
  },
  {
    id: 'creator_mock_006',
    displayName: 'Elena Rossi',
    email: 'elena.rossi@example.com',
    country: 'IT',
    languages: ['it', 'en'],
    status: 'ACTIVE',
    onboardingStatus: 'COMPLETE',
    complianceStatus: 'COMPLIANT',
    intelligenceScore: 80,
    performanceScore: 77,
    performanceBand: 'STRONG',
    latestActivity: 'Scheduled live session tomorrow',
    managerName: 'Taylor Brooks',
    platformBadges: ['INSTAGRAM'],
    updatedAt: iso(-60 * 6),
  },
];

const MOCK_DETAILS: Record<string, ManagerCreatorDetail> = {
  creator_mock_001: {
    creatorId: 'creator_mock_001',
    profile: {
      displayName: 'Alex Rivera',
      bio: 'Live creator focused on music, community engagement, and brand storytelling.',
      status: 'ACTIVE',
      commissionPlan: 'STANDARD',
      recruiterName: 'Jordan Lee',
      organizationName: 'Kōlab Creator Agency',
    },
    contact: {
      email: 'alex.rivera@example.com',
      phone: '+1 555 010 2244',
      country: 'US',
      languages: ['en', 'es'],
    },
    platformAccounts: [
      {
        platform: 'TIKTOK',
        username: 'alexrivera.live',
        followers: 128000,
        verified: true,
        status: 'ACTIVE',
      },
      {
        platform: 'INSTAGRAM',
        username: 'alexrivera',
        followers: 42000,
        verified: false,
        status: 'ACTIVE',
      },
      {
        platform: 'YOUTUBE',
        username: 'AlexRiveraLive',
        followers: 18500,
        verified: true,
        status: 'ACTIVE',
      },
    ],
    skills: {
      categories: ['Music', 'Entertainment', 'Brand partnerships'],
      skills: ['Live hosting', 'Audience engagement', 'Product demos'],
      contentTypes: ['live', 'short-form', 'sponsored'],
      languages: ['en', 'es'],
      experienceLevel: 'ADVANCED',
    },
    availability: {
      timezone: 'America/Los_Angeles',
      weeklySchedule: ['Mon 18:00-21:00', 'Wed 18:00-21:00', 'Fri 19:00-22:00'],
      preferredLiveTimes: ['Weekday evenings', 'Saturday afternoons'],
      blackoutDates: ['2026-07-15'],
      notes: 'Unavailable during major travel weeks.',
    },
    compliance: {
      overallStatus: 'AT_RISK',
      missingDocuments: 1,
      expiringDocuments: 1,
      expiringContracts: 1,
    },
    onboarding: {
      overallStatus: 'INCOMPLETE',
      completionPercent: 83,
      incompleteItems: ['Skills and categories added'],
    },
    goalsSummary: {
      activeGoals: 4,
      completedGoals: 2,
      highlights: ['Stream 4 days this week — 50%', 'Weekly gift revenue — 64%'],
    },
    performanceSummary: {
      overallScore: 82,
      scoreBand: 'STRONG',
      strengths: ['Consistent live cadence', 'Strong gifter retention'],
      risks: ['Compliance document expiring soon'],
    },
    intelligenceSummary: {
      overallScore: 75,
      trendDirection: 'IMPROVING',
      highlights: ['Gift velocity up 12% week over week', 'Top gifter retention stable'],
    },
    recentCampaigns: [
      { id: 'camp_1', title: 'Summer Beauty Launch', status: 'ACTIVE', dueAt: iso(60 * 24 * 2) },
      { id: 'camp_2', title: 'Music Festival Promo', status: 'PENDING', dueAt: iso(60 * 24 * 10) },
    ],
    liveSummary: {
      latestSessionTitle: 'Evening Q&A',
      latestSessionStatus: 'ENDED',
      scheduledCount: 3,
      openAlerts: 2,
    },
  },
};

function createFallbackDetail(item: ManagerCreatorListItem): ManagerCreatorDetail {
  return {
    creatorId: item.id,
    profile: {
      displayName: item.displayName,
      bio: null,
      status: item.status,
      commissionPlan: 'STANDARD',
      recruiterName: item.managerName,
      organizationName: 'Kōlab Creator Agency',
    },
    contact: {
      email: item.email,
      phone: null,
      country: item.country,
      languages: item.languages,
    },
    platformAccounts: item.platformBadges.map((platform) => ({
      platform,
      username: `${item.displayName.toLowerCase().replace(/\s+/g, '')}`,
      followers: null,
      verified: false,
      status: 'ACTIVE',
    })),
    skills: {
      categories: ['General'],
      skills: ['Live streaming'],
      contentTypes: ['live'],
      languages: item.languages,
      experienceLevel: 'INTERMEDIATE',
    },
    availability: {
      timezone: null,
      weeklySchedule: [],
      preferredLiveTimes: [],
      blackoutDates: [],
      notes: null,
    },
    compliance: {
      overallStatus: item.complianceStatus,
      missingDocuments: item.complianceStatus === 'BLOCKED' ? 2 : 0,
      expiringDocuments: item.complianceStatus === 'AT_RISK' ? 1 : 0,
      expiringContracts: 0,
    },
    onboarding: {
      overallStatus: item.onboardingStatus,
      completionPercent: item.onboardingStatus === 'COMPLETE' ? 100 : 75,
      incompleteItems: item.onboardingStatus === 'COMPLETE' ? [] : ['Pending checklist items'],
    },
    goalsSummary: {
      activeGoals: 2,
      completedGoals: 1,
      highlights: ['Active goals on track'],
    },
    performanceSummary: {
      overallScore: item.performanceScore,
      scoreBand: item.performanceBand,
      strengths: ['Reliable schedule'],
      risks: item.performanceBand === 'AT_RISK' ? ['Performance trending down'] : [],
    },
    intelligenceSummary: {
      overallScore: item.intelligenceScore,
      trendDirection: 'STABLE',
      highlights: ['Intelligence profile available'],
    },
    recentCampaigns: [
      { id: 'camp_generic', title: 'Assigned campaign', status: 'ACTIVE', dueAt: iso(60 * 24 * 7) },
    ],
    liveSummary: {
      latestSessionTitle: 'Recent live session',
      latestSessionStatus: 'ENDED',
      scheduledCount: 1,
      openAlerts: 0,
    },
  };
}

export function createMockCreatorManagementWorkspace(
  organizationId: string,
): ManagerCreatorManagementWorkspace {
  return {
    organizationId,
    generatedAt: now.toISOString(),
    list: {
      items: MOCK_CREATORS,
      nextCursor: 'creator_mock_page_2',
      totalCount: MOCK_CREATORS.length,
    },
  };
}

export function createMockCreatorDetail(creatorId: string): ManagerCreatorDetail | null {
  if (MOCK_DETAILS[creatorId]) {
    return MOCK_DETAILS[creatorId]!;
  }

  const item = MOCK_CREATORS.find((creator) => creator.id === creatorId);
  return item ? createFallbackDetail(item) : null;
}

export function getMockCreatorListItems(): ManagerCreatorListItem[] {
  return MOCK_CREATORS;
}
