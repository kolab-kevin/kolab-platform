import type {
  CreatorLead as PrismaCreatorLead,
  CreatorPlatformAccount as PrismaCreatorPlatformAccount,
  CreatorProfile as PrismaCreatorProfile,
} from '@kolab/database';
import { MembershipStatus } from '@kolab/database';
import type { Creator, CreatorPlatformAccount, CreatorSummary } from '@kolab/types';

export type CreatorProfileWithAccounts = PrismaCreatorProfile & {
  platformAccounts: PrismaCreatorPlatformAccount[];
  sourceLead?: PrismaCreatorLead | null;
};

export function getSourceLeadPlatformAccountId(
  metadata: PrismaCreatorPlatformAccount['metadata'],
): string | null {
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('sourceLeadPlatformAccountId' in metadata)
  ) {
    return null;
  }

  const value = (metadata as Record<string, unknown>).sourceLeadPlatformAccountId;

  return typeof value === 'string' ? value : null;
}

export function toCreatorPlatformAccount(
  account: PrismaCreatorPlatformAccount,
): CreatorPlatformAccount {
  return {
    id: account.id,
    organizationId: account.organizationId,
    creatorId: account.creatorProfileId,
    platform: account.platform as CreatorPlatformAccount['platform'],
    username: account.username,
    profileUrl: account.profileUrl,
    followers: account.followers,
    verified: account.verified,
    status: account.status as CreatorPlatformAccount['status'],
    sourceLeadPlatformAccountId: getSourceLeadPlatformAccountId(account.metadata),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function toCreatorFromProfile(profile: CreatorProfileWithAccounts): Creator {
  const sourceLead = profile.sourceLead ?? null;

  return {
    id: profile.id,
    organizationId: profile.organizationId,
    userId: profile.userId,
    sourceLeadId: profile.sourceLeadId ?? sourceLead?.id ?? '',
    displayName: profile.displayName,
    email: sourceLead?.email ?? null,
    phone: sourceLead?.phone ?? null,
    country: profile.country,
    languages: profile.languages,
    assignedRecruiterId: profile.recruiterUserId,
    commissionPlan: (sourceLead?.commissionPlan ?? 'STANDARD') as Creator['commissionPlan'],
    platformAccounts: profile.platformAccounts.map(toCreatorPlatformAccount),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toCreatorSummary(
  profile: CreatorProfileWithAccounts,
  membershipStatus: MembershipStatus = MembershipStatus.ACTIVE,
): CreatorSummary {
  const sourceLead = profile.sourceLead ?? null;

  return {
    id: profile.id,
    organizationId: profile.organizationId,
    userId: profile.userId,
    displayName: profile.displayName,
    email: sourceLead?.email ?? null,
    country: profile.country,
    languages: profile.languages,
    assignedRecruiterId: profile.recruiterUserId,
    status: membershipStatus,
    platformCount: profile.platformAccounts.length,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
