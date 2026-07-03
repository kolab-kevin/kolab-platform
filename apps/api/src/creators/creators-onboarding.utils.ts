import type {
  CreatorOnboardingChecklistItem,
  CreatorOnboardingChecklistResponse,
  CreatorOnboardingOverallStatus,
} from '@kolab/types';

import { getCreatorSkillsFromMetadata } from './creators.utils';

export type CreatorOnboardingSourceData = {
  creatorId: string;
  organizationId: string;
  displayName: string | null;
  country: string | null;
  availability: unknown;
  metadata: unknown;
  platformAccounts: Array<{ id: string; status: string; platform: string; username: string }>;
  governmentIdDocument: { id: string; status: string } | null;
  creatorAgreement: { id: string; status: string; signedAt: Date | null } | null;
};

function isNonEmptyRecord(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.keys(value).length > 0;
}

function hasSkillsPresent(metadata: unknown): boolean {
  const skills = getCreatorSkillsFromMetadata(metadata, []);

  return skills.skills.length > 0 || skills.categories.length > 0;
}

function buildRequiredItem(
  key: CreatorOnboardingChecklistItem['key'],
  label: string,
  complete: boolean,
  details: Record<string, unknown>,
): CreatorOnboardingChecklistItem {
  return {
    key,
    label,
    required: true,
    status: complete ? 'COMPLETE' : 'INCOMPLETE',
    details,
  };
}

function buildOptionalItem(
  key: CreatorOnboardingChecklistItem['key'],
  label: string,
  complete: boolean,
  details: Record<string, unknown>,
): CreatorOnboardingChecklistItem {
  return {
    key,
    label,
    required: false,
    status: complete ? 'COMPLETE' : 'WARNING',
    details,
  };
}

export function deriveCreatorOnboardingOverallStatus(
  items: CreatorOnboardingChecklistItem[],
): CreatorOnboardingOverallStatus {
  const requiredItems = items.filter((item) => item.required);
  const optionalItems = items.filter((item) => !item.required);

  if (requiredItems.some((item) => item.status === 'INCOMPLETE')) {
    return 'INCOMPLETE';
  }

  if (optionalItems.some((item) => item.status === 'WARNING')) {
    return 'WARNING';
  }

  return 'COMPLETE';
}

export function buildCreatorOnboardingChecklist(
  source: CreatorOnboardingSourceData,
): CreatorOnboardingChecklistResponse {
  const missingProfileFields: string[] = [];

  if (!source.displayName?.trim()) {
    missingProfileFields.push('displayName');
  }

  if (!source.country?.trim()) {
    missingProfileFields.push('country');
  }

  const activePlatformAccounts = source.platformAccounts.filter(
    (account) => account.status !== 'REMOVED',
  );

  const items: CreatorOnboardingChecklistItem[] = [
    buildRequiredItem('profile_complete', 'Profile complete', missingProfileFields.length === 0, {
      missingFields: missingProfileFields,
      displayName: source.displayName,
      country: source.country,
    }),
    buildRequiredItem(
      'government_id_approved',
      'Government ID approved',
      source.governmentIdDocument?.status === 'APPROVED',
      {
        documentId: source.governmentIdDocument?.id ?? null,
        status: source.governmentIdDocument?.status ?? null,
        documentType: 'GOVERNMENT_ID',
      },
    ),
    buildRequiredItem(
      'creator_agreement_signed',
      'Creator agreement signed',
      source.creatorAgreement?.status === 'SIGNED',
      {
        contractId: source.creatorAgreement?.id ?? null,
        status: source.creatorAgreement?.status ?? null,
        contractType: 'CREATOR_AGREEMENT',
        signedAt: source.creatorAgreement?.signedAt?.toISOString() ?? null,
      },
    ),
    buildOptionalItem(
      'platform_account_present',
      'Platform account present',
      activePlatformAccounts.length > 0,
      {
        activeAccountCount: activePlatformAccounts.length,
        accounts: activePlatformAccounts.map((account) => ({
          id: account.id,
          platform: account.platform,
          username: account.username,
          status: account.status,
        })),
      },
    ),
    buildOptionalItem(
      'availability_present',
      'Availability present',
      isNonEmptyRecord(source.availability),
      {
        hasAvailability: isNonEmptyRecord(source.availability),
      },
    ),
    buildOptionalItem('skills_present', 'Skills present', hasSkillsPresent(source.metadata), {
      hasSkills: hasSkillsPresent(source.metadata),
      skills: getCreatorSkillsFromMetadata(source.metadata, []).skills,
      categories: getCreatorSkillsFromMetadata(source.metadata, []).categories,
    }),
  ];

  return {
    creatorId: source.creatorId,
    organizationId: source.organizationId,
    overallStatus: deriveCreatorOnboardingOverallStatus(items),
    items,
  };
}
