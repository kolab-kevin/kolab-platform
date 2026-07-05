import type {
  CreatorComplianceResponse,
  CreatorDetailResponse,
  CreatorSkills,
  CreatorStructuredAvailability,
  ListCreatorPlatformAccountsResponse,
  ProfileResponse,
} from '@kolab/types';

const now = new Date();
const iso = (offsetMinutes: number) =>
  new Date(now.getTime() + offsetMinutes * 60 * 1000).toISOString();

function createMockCreatorSummary(creatorProfileId: string, organizationId = 'org_mock_001') {
  return {
    id: creatorProfileId,
    organizationId,
    userId: 'user_mock_001',
    displayName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    country: 'US',
    languages: ['en', 'es'],
    assignedRecruiterId: 'recruiter_mock_001',
    status: 'ACTIVE' as const,
    platformCount: 4,
    createdAt: iso(-60 * 24 * 30),
    updatedAt: iso(-120),
  };
}

export function createMockCreatorDetail(
  creatorProfileId: string,
  organizationId = 'org_mock_001',
): CreatorDetailResponse {
  return {
    creator: {
      id: creatorProfileId,
      organizationId,
      userId: 'user_mock_001',
      sourceLeadId: 'lead_mock_001',
      displayName: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 555 010 2244',
      country: 'US',
      languages: ['en', 'es'],
      assignedRecruiterId: 'recruiter_mock_001',
      commissionPlan: 'STANDARD',
      platformAccounts: [],
      bio: 'Live creator focused on music, community engagement, and brand storytelling.',
      availability: {
        timezone: 'America/Los_Angeles',
        weekdays: [1, 2, 3, 4, 5],
        hoursStart: '18:00',
        hoursEnd: '22:00',
        notes: 'Prefers evening sessions on weekdays.',
      },
      metadata: {},
      status: 'ACTIVE',
      createdAt: iso(-60 * 24 * 30),
      updatedAt: iso(-120),
    },
    user: {
      id: 'user_mock_001',
      email: 'alex.rivera@example.com',
      displayName: 'Alex Rivera',
      avatarUrl: null,
    },
    recruiter: {
      id: 'recruiter_mock_001',
      userId: 'user_recruiter_001',
      displayName: 'Jordan Lee',
      nickname: 'Jordan',
      territory: 'West Coast',
      status: 'ACTIVE',
    },
    organization: {
      id: organizationId,
      name: 'Kōlab Creator Agency',
      slug: 'kolab-agency',
      type: 'AGENCY',
      status: 'ACTIVE',
    },
    platformAccounts: createMockPlatformAccounts(creatorProfileId, organizationId).items,
  };
}

export function createMockPlatformAccounts(
  creatorProfileId: string,
  organizationId = 'org_mock_001',
): ListCreatorPlatformAccountsResponse {
  return {
    items: [
      {
        id: 'platform_account_1',
        organizationId,
        creatorId: creatorProfileId,
        platform: 'TIKTOK',
        username: 'alexrivera.live',
        profileUrl: 'https://tiktok.com/@alexrivera.live',
        followers: 128000,
        verified: true,
        status: 'ACTIVE',
        sourceLeadPlatformAccountId: null,
        createdAt: iso(-60 * 24 * 20),
        updatedAt: iso(-120),
      },
      {
        id: 'platform_account_2',
        organizationId,
        creatorId: creatorProfileId,
        platform: 'INSTAGRAM',
        username: 'alexrivera',
        profileUrl: 'https://instagram.com/alexrivera',
        followers: 42000,
        verified: false,
        status: 'ACTIVE',
        sourceLeadPlatformAccountId: null,
        createdAt: iso(-60 * 24 * 18),
        updatedAt: iso(-180),
      },
      {
        id: 'platform_account_3',
        organizationId,
        creatorId: creatorProfileId,
        platform: 'YOUTUBE',
        username: 'AlexRiveraLive',
        profileUrl: 'https://youtube.com/@AlexRiveraLive',
        followers: 18500,
        verified: true,
        status: 'ACTIVE',
        sourceLeadPlatformAccountId: null,
        createdAt: iso(-60 * 24 * 10),
        updatedAt: iso(-240),
      },
      {
        id: 'platform_account_4',
        organizationId,
        creatorId: creatorProfileId,
        platform: 'TWITCH',
        username: 'alexrivera',
        profileUrl: 'https://twitch.tv/alexrivera',
        followers: 9600,
        verified: false,
        status: 'UNVERIFIED',
        sourceLeadPlatformAccountId: null,
        createdAt: iso(-60 * 24 * 5),
        updatedAt: iso(-300),
      },
    ],
  };
}

export function createMockCreatorSkills(): CreatorSkills {
  return {
    categories: ['Music', 'Entertainment', 'Brand partnerships'],
    skills: ['Live hosting', 'Audience engagement', 'Product demos'],
    contentTypes: ['live', 'short-form', 'sponsored'],
    languages: ['en', 'es'],
    experienceLevel: 'ADVANCED',
    notes: 'Open to beauty and lifestyle campaigns with live shopping formats.',
  };
}

export function createMockCreatorAvailability(): CreatorStructuredAvailability {
  return {
    timezone: 'America/Los_Angeles',
    weeklySchedule: [
      { weekday: 1, start: '18:00', end: '21:00' },
      { weekday: 3, start: '18:00', end: '21:00' },
      { weekday: 5, start: '19:00', end: '22:00' },
    ],
    preferredLiveTimes: ['Weekday evenings', 'Saturday afternoons'],
    blackoutDates: ['2026-07-15'],
    notes: 'Unavailable during major travel weeks.',
  };
}

export function createMockCreatorCompliance(
  creatorProfileId: string,
  organizationId = 'org_mock_001',
): CreatorComplianceResponse {
  return {
    creatorId: creatorProfileId,
    organizationId,
    generatedAt: iso(-30),
    overallStatus: 'AT_RISK',
    onboarding: {
      creatorId: creatorProfileId,
      organizationId,
      overallStatus: 'INCOMPLETE',
      items: [
        {
          key: 'profile_complete',
          label: 'Complete creator profile',
          status: 'COMPLETE',
          required: true,
          details: {},
        },
        {
          key: 'government_id_approved',
          label: 'Government ID approved',
          status: 'WARNING',
          required: true,
          details: { reviewStatus: 'PENDING' },
        },
        {
          key: 'creator_agreement_signed',
          label: 'Creator agreement signed',
          status: 'COMPLETE',
          required: true,
          details: {},
        },
        {
          key: 'platform_account_present',
          label: 'Platform account connected',
          status: 'COMPLETE',
          required: true,
          details: {},
        },
        {
          key: 'availability_present',
          label: 'Availability provided',
          status: 'COMPLETE',
          required: true,
          details: {},
        },
        {
          key: 'skills_present',
          label: 'Skills and categories added',
          status: 'INCOMPLETE',
          required: false,
          details: {},
        },
      ],
    },
    documents: {
      missing: 1,
      expiring: 1,
      expired: 0,
      missingItems: [
        {
          status: 'MISSING' as const,
          creator: createMockCreatorSummary(creatorProfileId, organizationId),
          documentType: 'TAX_FORM' as const,
        },
      ],
      expiringItems: [
        {
          status: 'EXPIRING' as const,
          creator: createMockCreatorSummary(creatorProfileId, organizationId),
          document: {
            id: 'doc_mock_001',
            organizationId,
            creatorProfileId,
            sourceLeadId: null,
            documentType: 'GOVERNMENT_ID',
            status: 'APPROVED',
            title: null,
            expiresAt: iso(60 * 24 * 14),
            reviewedById: null,
            reviewedAt: null,
            rejectionReason: null,
            metadata: {},
            deletedAt: null,
            createdAt: iso(-60 * 24 * 60),
            updatedAt: iso(-120),
          },
          expiresAt: iso(60 * 24 * 14),
        },
      ],
    },
    contracts: {
      expiring: 1,
      expired: 0,
      expiringItems: [
        {
          status: 'EXPIRING' as const,
          creator: createMockCreatorSummary(creatorProfileId, organizationId),
          contract: {
            id: 'contract_mock_001',
            organizationId,
            creatorProfileId,
            sourceLeadId: null,
            contractType: 'CREATOR_AGREEMENT',
            status: 'SIGNED',
            title: 'Creator Agreement',
            parentContractId: null,
            validFrom: iso(-60 * 24 * 180),
            validUntil: iso(60 * 24 * 45),
            signedAt: iso(-60 * 24 * 180),
            signedByUserId: 'user_mock_001',
            externalEnvelopeId: null,
            metadata: {},
            deletedAt: null,
            createdAt: iso(-60 * 24 * 180),
            updatedAt: iso(-120),
          },
          validUntil: iso(60 * 24 * 45),
        },
      ],
    },
    sensitiveAccess: {
      sensitiveDocumentTypes: ['GOVERNMENT_ID', 'TAX_FORM'],
      downloadRequiresPermission: 'documents:download_sensitive',
      callerCanDownloadSensitive: true,
    },
  };
}

export function createMockUserProfile(): ProfileResponse {
  return {
    user: {
      id: 'user_mock_001',
      email: 'alex.rivera@example.com',
      role: 'CREATOR',
      isSystemAdmin: false,
      createdAt: iso(-60 * 24 * 90),
      updatedAt: iso(-120),
    },
    profile: {
      displayName: 'Alex Rivera',
      avatarUrl: null,
      bio: 'Live creator focused on music and community engagement.',
      language: 'en',
      timezone: 'America/Los_Angeles',
      country: 'US',
    },
  };
}
