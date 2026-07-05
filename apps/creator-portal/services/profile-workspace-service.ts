import { getCreatorProfileId, useMockStudioData } from '@/lib/env';
import {
  buildProfileWorkspaceData,
  createEmptyProfileWorkspaceData,
  type ProfileWorkspaceData,
} from '@/types/profile-adapters';

import {
  fetchCreatorAvailability,
  fetchCreatorCompliance,
  fetchCreatorDetail,
  fetchCreatorPlatformAccounts,
  fetchCreatorSkills,
} from './profile-service';

export type ProfileWorkspaceDataSource = 'mock' | 'live' | 'empty' | 'partial';

export type ProfileWorkspaceFetchResult = {
  data: ProfileWorkspaceData;
  source: ProfileWorkspaceDataSource;
};

export async function fetchProfileWorkspace(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ProfileWorkspaceFetchResult> {
  if (useMockStudioData()) {
    const [detailResult, platformResult, skillsResult, availabilityResult, complianceResult] =
      await Promise.all([
        fetchCreatorDetail(creatorProfileId),
        fetchCreatorPlatformAccounts(creatorProfileId),
        fetchCreatorSkills(creatorProfileId),
        fetchCreatorAvailability(creatorProfileId),
        fetchCreatorCompliance(creatorProfileId),
      ]);

    return {
      data: buildProfileWorkspaceData({
        creatorProfileId,
        detail: detailResult.data,
        platformAccounts: platformResult.data,
        skills: skillsResult.data,
        availability: availabilityResult.data,
        compliance: complianceResult.data,
      }),
      source: 'mock',
    };
  }

  let hadPartialFailure = false;

  const [detailResult, platformResult, skillsResult, availabilityResult, complianceResult] =
    await Promise.all([
      fetchCreatorDetail(creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchCreatorPlatformAccounts(creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchCreatorSkills(creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchCreatorAvailability(creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchCreatorCompliance(creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
    ]);

  const data = buildProfileWorkspaceData({
    creatorProfileId,
    detail: detailResult.data,
    platformAccounts: platformResult.data,
    skills: skillsResult.data,
    availability: availabilityResult.data,
    compliance: complianceResult.data,
  });

  const isEmpty =
    !data.profile && data.platformAccounts.length === 0 && !data.skills && !data.compliance;

  return {
    data,
    source: isEmpty ? 'empty' : hadPartialFailure ? 'partial' : 'live',
  };
}

export { createEmptyProfileWorkspaceData };
