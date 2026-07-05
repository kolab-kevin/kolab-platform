import type {
  CreatorComplianceResponse,
  CreatorDetailResponse,
  CreatorPlatformAccount,
  CreatorSkills,
  CreatorStructuredAvailability,
  ListCreatorPlatformAccountsResponse,
  ProfileResponse,
} from '@kolab/types';

export type ProfileContactInfo = {
  email: string | null;
  phone: string | null;
  canViewEmail: boolean;
  canViewPhone: boolean;
};

export type ProfileDisplayModel = {
  avatarUrl: string | null;
  displayName: string;
  username: string | null;
  bio: string | null;
  languages: string[];
  country: string | null;
  timezone: string | null;
  contact: ProfileContactInfo;
  status: string;
  organizationName: string;
};

export type PlatformAccountDisplayModel = {
  id: string;
  platform: string;
  username: string;
  profileUrl: string | null;
  followers: number | null;
  verified: boolean;
  status: string;
  connected: boolean;
};

export type SkillsDisplayModel = {
  skills: string[];
  categories: string[];
  contentTypes: string[];
  languages: string[];
  experienceLevel: string | null;
  preferredCampaignTypes: string[];
  availability: CreatorStructuredAvailability | null;
  notes: string | null;
};

export type ComplianceDisplayModel = {
  overallStatus: string;
  onboardingStatus: string;
  onboardingCompletionPercent: number;
  onboardingItems: CreatorComplianceResponse['onboarding']['items'];
  missingRequirements: string[];
  documentSummary: {
    missing: number;
    expiring: number;
    expired: number;
  };
  contractSummary: {
    expiring: number;
    expired: number;
  };
  verificationStatus: string;
};

export type ProfileWorkspaceData = {
  creatorProfileId: string | null;
  profile: ProfileDisplayModel | null;
  platformAccounts: PlatformAccountDisplayModel[];
  skills: SkillsDisplayModel | null;
  compliance: ComplianceDisplayModel | null;
};

export type SettingsGeneralModel = {
  displayName: string | null;
  email: string;
  language: string;
  timezone: string;
  country: string | null;
};

export type SettingsEnvironmentModel = {
  apiBaseUrl: string;
  creatorProfileId: string;
  mockMode: boolean;
  nodeEnv: string;
};

export type SettingsWorkspaceData = {
  general: SettingsGeneralModel | null;
  mockMode: boolean;
  version: string;
  environment: SettingsEnvironmentModel;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatProfileLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function formatLanguageList(languages: string[]): string {
  if (languages.length === 0) return 'None listed';
  return languages.join(', ');
}

export function formatWeekday(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? `Day ${weekday}`;
}

export function derivePrimaryUsername(platformAccounts: CreatorPlatformAccount[]): string | null {
  const preferred =
    platformAccounts.find((account) => account.platform === 'TIKTOK') ?? platformAccounts[0];
  return preferred?.username ?? null;
}

export function toPlatformAccountDisplayModels(
  response: ListCreatorPlatformAccountsResponse | null,
  fallbackAccounts: CreatorPlatformAccount[] = [],
): PlatformAccountDisplayModel[] {
  const accounts = response?.items ?? fallbackAccounts;

  return accounts.map((account) => ({
    id: account.id,
    platform: account.platform,
    username: account.username,
    profileUrl: account.profileUrl,
    followers: account.followers,
    verified: account.verified,
    status: account.status,
    connected: account.status === 'ACTIVE' || account.status === 'UNVERIFIED',
  }));
}

export function buildProfileContactInfo(
  detail: CreatorDetailResponse | null,
  compliance: CreatorComplianceResponse | null,
): ProfileContactInfo {
  const canViewSensitive = compliance?.sensitiveAccess.callerCanDownloadSensitive ?? true;

  return {
    email: detail?.user.email ?? detail?.creator.email ?? null,
    phone: detail?.creator.phone ?? null,
    canViewEmail: Boolean(detail?.user.email ?? detail?.creator.email),
    canViewPhone: canViewSensitive && Boolean(detail?.creator.phone),
  };
}

export function toProfileDisplayModel(
  detail: CreatorDetailResponse | null,
  compliance: CreatorComplianceResponse | null,
): ProfileDisplayModel | null {
  if (!detail) return null;

  const timezone =
    detail.creator.availability?.timezone ??
    (typeof detail.creator.metadata.timezone === 'string'
      ? detail.creator.metadata.timezone
      : null);

  return {
    avatarUrl: detail.user.avatarUrl,
    displayName: detail.creator.displayName,
    username: derivePrimaryUsername(detail.platformAccounts),
    bio: detail.creator.bio,
    languages: detail.creator.languages,
    country: detail.creator.country,
    timezone,
    contact: buildProfileContactInfo(detail, compliance),
    status: detail.creator.status,
    organizationName: detail.organization.name,
  };
}

export function toSkillsDisplayModel(
  skills: CreatorSkills | null,
  availability: CreatorStructuredAvailability | null,
): SkillsDisplayModel | null {
  if (!skills && !availability) return null;

  const resolvedSkills = skills ?? {
    categories: [],
    skills: [],
    contentTypes: [],
    languages: [],
    experienceLevel: null,
    notes: null,
  };

  return {
    skills: resolvedSkills.skills,
    categories: resolvedSkills.categories,
    contentTypes: resolvedSkills.contentTypes,
    languages: resolvedSkills.languages,
    experienceLevel: resolvedSkills.experienceLevel,
    preferredCampaignTypes: resolvedSkills.contentTypes,
    availability,
    notes: resolvedSkills.notes,
  };
}

export function toComplianceDisplayModel(
  compliance: CreatorComplianceResponse | null,
): ComplianceDisplayModel | null {
  if (!compliance) return null;

  const completedItems = compliance.onboarding.items.filter(
    (item) => item.status === 'COMPLETE',
  ).length;
  const onboardingCompletionPercent =
    compliance.onboarding.items.length === 0
      ? 0
      : Math.round((completedItems / compliance.onboarding.items.length) * 100);

  const missingRequirements = [
    ...compliance.documents.missingItems.map((item) => item.documentType),
    ...compliance.onboarding.items
      .filter((item) => item.status !== 'COMPLETE')
      .map((item) => item.label),
  ];

  const verificationStatus =
    compliance.onboarding.items.find((item) => item.key === 'government_id_approved')?.status ??
    'INCOMPLETE';

  return {
    overallStatus: compliance.overallStatus,
    onboardingStatus: compliance.onboarding.overallStatus,
    onboardingCompletionPercent,
    onboardingItems: compliance.onboarding.items,
    missingRequirements,
    documentSummary: {
      missing: compliance.documents.missing,
      expiring: compliance.documents.expiring,
      expired: compliance.documents.expired,
    },
    contractSummary: {
      expiring: compliance.contracts.expiring,
      expired: compliance.contracts.expired,
    },
    verificationStatus,
  };
}

export function buildProfileWorkspaceData(input: {
  creatorProfileId: string | null;
  detail: CreatorDetailResponse | null;
  platformAccounts: ListCreatorPlatformAccountsResponse | null;
  skills: CreatorSkills | null;
  availability: CreatorStructuredAvailability | null;
  compliance: CreatorComplianceResponse | null;
}): ProfileWorkspaceData {
  return {
    creatorProfileId: input.creatorProfileId,
    profile: toProfileDisplayModel(input.detail, input.compliance),
    platformAccounts: toPlatformAccountDisplayModels(
      input.platformAccounts,
      input.detail?.platformAccounts ?? [],
    ),
    skills: toSkillsDisplayModel(input.skills, input.availability),
    compliance: toComplianceDisplayModel(input.compliance),
  };
}

export function createEmptyProfileWorkspaceData(): ProfileWorkspaceData {
  return buildProfileWorkspaceData({
    creatorProfileId: null,
    detail: null,
    platformAccounts: null,
    skills: null,
    availability: null,
    compliance: null,
  });
}

export function toSettingsGeneralModel(
  profile: ProfileResponse | null,
): SettingsGeneralModel | null {
  if (!profile) return null;

  return {
    displayName: profile.profile.displayName,
    email: profile.user.email,
    language: profile.profile.language,
    timezone: profile.profile.timezone,
    country: profile.profile.country,
  };
}

export function buildSettingsWorkspaceData(input: {
  profile: ProfileResponse | null;
  mockMode: boolean;
  version: string;
  environment: SettingsEnvironmentModel;
}): SettingsWorkspaceData {
  return {
    general: toSettingsGeneralModel(input.profile),
    mockMode: input.mockMode,
    version: input.version,
    environment: input.environment,
  };
}

export function createEmptySettingsWorkspaceData(
  environment: SettingsEnvironmentModel,
  version: string,
  mockMode: boolean,
): SettingsWorkspaceData {
  return buildSettingsWorkspaceData({
    profile: null,
    mockMode,
    version,
    environment,
  });
}
