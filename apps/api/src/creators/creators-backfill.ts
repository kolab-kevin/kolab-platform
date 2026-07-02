import type {
  CreatorLead as PrismaCreatorLead,
  LeadPlatformAccount as PrismaLeadPlatformAccount,
  Prisma,
} from '@kolab/database';
import { prisma } from '@kolab/database';

import { activeLeadMetadataFilter } from '../recruitment/recruitment.utils';
import {
  getCreatorPlatformAccounts,
  getCreatorProfile,
  type StoredCreatorPlatformAccount,
} from './creators.utils';

type TransactionClient = Prisma.TransactionClient;

export async function backfillCreatorProfilesForOrganization(
  organizationId: string,
): Promise<void> {
  const orphanLeads = await prisma.creatorLead.findMany({
    where: {
      organizationId,
      convertedUserId: { not: null },
      convertedAt: { not: null },
      creatorProfile: null,
      ...activeLeadMetadataFilter(),
    },
    include: {
      platformAccounts: true,
    },
  });

  for (const lead of orphanLeads) {
    await backfillCreatorProfileFromLead(lead);
  }
}

export async function backfillCreatorProfileFromLead(
  lead: PrismaCreatorLead & { platformAccounts: PrismaLeadPlatformAccount[] },
) {
  const existing = lead.convertedUserId
    ? await prisma.creatorProfile.findUnique({
        where: {
          organizationId_userId: {
            organizationId: lead.organizationId,
            userId: lead.convertedUserId,
          },
        },
      })
    : null;

  if (existing) {
    if (!existing.sourceLeadId) {
      await prisma.creatorProfile.update({
        where: { id: existing.id },
        data: { sourceLeadId: lead.id },
      });
    }

    return existing;
  }

  const metadataProfile = getCreatorProfile(lead.metadata);
  const metadataAccounts = getCreatorPlatformAccounts(lead.metadata);

  if (!metadataProfile || !lead.convertedUserId) {
    return null;
  }

  return prisma.$transaction(async (tx) =>
    createProfileFromLead(tx, lead, metadataProfile, metadataAccounts),
  );
}

export async function createProfileFromLead(
  tx: TransactionClient,
  lead: PrismaCreatorLead & { platformAccounts: PrismaLeadPlatformAccount[] },
  metadataProfile?: ReturnType<typeof getCreatorProfile>,
  metadataAccounts: StoredCreatorPlatformAccount[] = [],
) {
  if (!lead.convertedUserId) {
    return null;
  }

  const profile = await tx.creatorProfile.upsert({
    where: {
      organizationId_userId: {
        organizationId: lead.organizationId,
        userId: lead.convertedUserId,
      },
    },
    create: {
      ...(metadataProfile?.id ? { id: metadataProfile.id } : {}),
      organizationId: lead.organizationId,
      userId: lead.convertedUserId,
      sourceLeadId: lead.id,
      displayName: metadataProfile?.displayName ?? lead.name,
      bio: metadataProfile?.bio ?? null,
      country: metadataProfile?.country ?? lead.country,
      languages: metadataProfile?.languages ?? lead.languages,
      availability: (metadataProfile?.availability ?? {}) as Prisma.InputJsonValue,
      metadata: (metadataProfile?.metadata ?? {}) as Prisma.InputJsonValue,
      recruiterUserId: metadataProfile?.assignedRecruiterId ?? lead.assignedRecruiterId,
      status: 'ACTIVE',
    },
    update: {
      sourceLeadId: lead.id,
    },
  });

  await copyLeadPlatformAccountsToProfile(
    tx,
    lead,
    profile.id,
    lead.platformAccounts,
    metadataAccounts,
  );

  return profile;
}

export async function copyLeadPlatformAccountsToProfile(
  tx: TransactionClient,
  lead: PrismaCreatorLead & { platformAccounts: PrismaLeadPlatformAccount[] },
  creatorProfileId: string,
  leadPlatformAccounts: PrismaLeadPlatformAccount[],
  metadataAccounts: StoredCreatorPlatformAccount[] = [],
) {
  const accountsToCopy =
    leadPlatformAccounts.length > 0
      ? leadPlatformAccounts.map((account) => ({
          platform: account.platform,
          username: account.username,
          profileUrl: account.profileUrl,
          followers: account.followers,
          verified: account.verified,
          status: account.status,
          sourceLeadPlatformAccountId: account.id,
        }))
      : metadataAccounts.map((account) => ({
          platform: account.platform as PrismaLeadPlatformAccount['platform'],
          username: account.username,
          profileUrl: account.profileUrl,
          followers: account.followers,
          verified: account.verified,
          status: account.status as PrismaLeadPlatformAccount['status'],
          sourceLeadPlatformAccountId: account.sourceLeadPlatformAccountId,
        }));

  for (const account of accountsToCopy) {
    await tx.creatorPlatformAccount.upsert({
      where: {
        organizationId_platform_username: {
          organizationId: lead.organizationId,
          platform: account.platform,
          username: account.username,
        },
      },
      create: {
        organizationId: lead.organizationId,
        creatorProfileId,
        platform: account.platform,
        username: account.username,
        profileUrl: account.profileUrl,
        followers: account.followers,
        verified: account.verified,
        status: account.status,
        metadata: {
          sourceLeadPlatformAccountId: account.sourceLeadPlatformAccountId,
        } as Prisma.InputJsonValue,
      },
      update: {},
    });
  }
}
