import { randomBytes } from 'node:crypto';

import { toRecord } from '../recruitment/recruitment.utils';

export const CREATOR_PROFILE_METADATA_KEY = 'creatorProfile';
export const CREATOR_PLATFORM_ACCOUNTS_METADATA_KEY = 'creatorPlatformAccounts';
export const CONVERSION_HISTORY_METADATA_KEY = 'conversionHistory';

export type StoredCreatorProfile = {
  id: string;
  userId: string;
  sourceLeadId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  languages: string[];
  assignedRecruiterId: string | null;
  commissionPlan: string;
  bio?: string | null;
  availability?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type StoredCreatorPlatformAccount = {
  id: string;
  organizationId: string;
  creatorId: string;
  platform: string;
  username: string;
  profileUrl: string | null;
  followers: number | null;
  verified: boolean;
  status: string;
  sourceLeadPlatformAccountId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversionHistoryEntry = {
  convertedAt: string;
  convertedBy: string;
  creatorId: string;
  userId: string;
};

export function getCreatorProfile(leadMetadata: unknown): StoredCreatorProfile | null {
  const profile = toRecord(leadMetadata)[CREATOR_PROFILE_METADATA_KEY];

  if (typeof profile !== 'object' || profile === null || !('id' in profile)) {
    return null;
  }

  return profile as StoredCreatorProfile;
}

export function getCreatorPlatformAccounts(leadMetadata: unknown): StoredCreatorPlatformAccount[] {
  const accounts = toRecord(leadMetadata)[CREATOR_PLATFORM_ACCOUNTS_METADATA_KEY];

  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts.filter(
    (account): account is StoredCreatorPlatformAccount =>
      typeof account === 'object' && account !== null && 'id' in account,
  );
}

export function getConversionHistory(leadMetadata: unknown): ConversionHistoryEntry[] {
  const history = toRecord(leadMetadata)[CONVERSION_HISTORY_METADATA_KEY];

  if (!Array.isArray(history)) {
    return [];
  }

  return history.filter(
    (entry): entry is ConversionHistoryEntry =>
      typeof entry === 'object' && entry !== null && 'convertedAt' in entry,
  );
}

export function buildConversionMetadata(
  leadMetadata: unknown,
  profile: StoredCreatorProfile,
  platformAccounts: StoredCreatorPlatformAccount[],
  historyEntry: ConversionHistoryEntry,
): Record<string, unknown> {
  const metadata = toRecord(leadMetadata);

  return {
    ...metadata,
    [CREATOR_PROFILE_METADATA_KEY]: profile,
    [CREATOR_PLATFORM_ACCOUNTS_METADATA_KEY]: platformAccounts,
    [CONVERSION_HISTORY_METADATA_KEY]: [...getConversionHistory(leadMetadata), historyEntry],
  };
}

export function createCreatorId(): string {
  return `creator_${randomBytes(12).toString('hex')}`;
}

export function createCreatorPlatformAccountId(): string {
  return `creator_platform_${randomBytes(12).toString('hex')}`;
}

export function updateStoredCreatorProfile(
  leadMetadata: unknown,
  updates: Partial<
    Pick<
      StoredCreatorProfile,
      'displayName' | 'bio' | 'country' | 'languages' | 'availability' | 'metadata'
    >
  >,
): Record<string, unknown> {
  const metadata = toRecord(leadMetadata);
  const profile = getCreatorProfile(leadMetadata);

  if (!profile) {
    throw new Error('Creator profile not found in lead metadata');
  }

  return {
    ...metadata,
    [CREATOR_PROFILE_METADATA_KEY]: {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };
}

export const CREATOR_SKILLS_METADATA_KEY = 'skills';

type CreatorSkillsShape = {
  categories: string[];
  skills: string[];
  contentTypes: string[];
  languages: string[];
  experienceLevel: string | null;
  notes: string | null;
};

type CreatorStructuredAvailabilityShape = {
  timezone?: string;
  weeklySchedule: Array<{ weekday: number; start: string; end: string }>;
  preferredLiveTimes: string[];
  blackoutDates: string[];
  notes: string | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function toWeeklySchedule(value: unknown): CreatorStructuredAvailabilityShape['weeklySchedule'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is CreatorStructuredAvailabilityShape['weeklySchedule'][number] =>
      typeof entry === 'object' &&
      entry !== null &&
      'weekday' in entry &&
      'start' in entry &&
      'end' in entry,
  );
}

export function getCreatorSkillsFromMetadata(
  metadata: unknown,
  profileLanguages: string[] = [],
): CreatorSkillsShape {
  const skillsRecord = toRecord(toRecord(metadata)[CREATOR_SKILLS_METADATA_KEY]);

  return {
    categories: toStringArray(skillsRecord.categories),
    skills: toStringArray(skillsRecord.skills),
    contentTypes: toStringArray(skillsRecord.contentTypes),
    languages: toStringArray(skillsRecord.languages).length
      ? toStringArray(skillsRecord.languages)
      : profileLanguages,
    experienceLevel:
      typeof skillsRecord.experienceLevel === 'string' ? skillsRecord.experienceLevel : null,
    notes: typeof skillsRecord.notes === 'string' ? skillsRecord.notes : null,
  };
}

export function mergeCreatorSkillsMetadata(
  metadata: unknown,
  updates: Partial<CreatorSkillsShape>,
): Record<string, unknown> {
  const record = toRecord(metadata);
  const existing = getCreatorSkillsFromMetadata(metadata, []);

  return {
    ...record,
    [CREATOR_SKILLS_METADATA_KEY]: {
      ...existing,
      ...updates,
    },
  };
}

export function getCreatorStructuredAvailability(
  availability: unknown,
): CreatorStructuredAvailabilityShape {
  const record = toRecord(availability);

  return {
    timezone: typeof record.timezone === 'string' ? record.timezone : undefined,
    weeklySchedule: toWeeklySchedule(record.weeklySchedule),
    preferredLiveTimes: toStringArray(record.preferredLiveTimes),
    blackoutDates: toStringArray(record.blackoutDates),
    notes: typeof record.notes === 'string' ? record.notes : null,
  };
}

export function mergeCreatorStructuredAvailability(
  availability: unknown,
  updates: Partial<CreatorStructuredAvailabilityShape>,
): Record<string, unknown> {
  const existing = getCreatorStructuredAvailability(availability);

  return {
    ...existing,
    ...updates,
  };
}
