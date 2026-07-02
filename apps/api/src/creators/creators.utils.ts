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
