import type {
  CampaignCreatorMatch,
  CampaignCreatorMatchBand,
  CampaignCreatorMatchesSnapshot,
  CampaignType,
  CreatorComplianceOverallStatus,
  CreatorLiveTrendSnapshot,
  CreatorPerformanceScore,
} from '@kolab/types';
import { CampaignCreatorMatchesSnapshotSchema } from '@kolab/types';

import { getCreatorSkillsFromMetadata } from '../creators/creators.utils';
import { clampIntelligenceScore } from '../live-intelligence/live-intelligence-engine.utils';
import { toMetadataRecord } from './campaigns.utils';

export const CAMPAIGN_CREATOR_MATCHES_METADATA_KEY = 'creatorMatches';

export type CampaignMatchRequirements = {
  platforms: string[];
  countries: string[];
  languages: string[];
  skills: string[];
  categories: string[];
  contentTypes: string[];
};

export type CreatorMatchCandidateInput = {
  creatorProfileId: string;
  displayName: string | null;
  country: string | null;
  languages: string[];
  metadata: unknown;
  availability: unknown;
  platformAccounts: Array<{ platform: string; status: string }>;
  performanceScore: CreatorPerformanceScore | null;
  liveTrendSnapshot: CreatorLiveTrendSnapshot | null;
  complianceStatus: CreatorComplianceOverallStatus;
  completedCampaignCount: number;
};

export type BuildCampaignCreatorMatchesInput = {
  campaignId: string;
  campaignType: CampaignType;
  requirements: unknown;
  brief: unknown;
  candidates: CreatorMatchCandidateInput[];
  generatedAt?: Date;
};

export function extractCampaignMatchRequirements(
  requirements: unknown,
  brief: unknown,
): CampaignMatchRequirements {
  const requirementsRecord = toMetadataRecord(requirements);
  const briefRecord = toMetadataRecord(brief);

  return {
    platforms: toNormalizedStringArray(requirementsRecord.platforms ?? briefRecord.platforms),
    countries: toNormalizedStringArray(requirementsRecord.countries ?? briefRecord.countries),
    languages: toNormalizedStringArray(requirementsRecord.languages ?? briefRecord.languages),
    skills: toNormalizedStringArray(requirementsRecord.skills ?? briefRecord.skills),
    categories: toNormalizedStringArray(requirementsRecord.categories ?? briefRecord.categories),
    contentTypes: toNormalizedStringArray(
      requirementsRecord.contentTypes ?? briefRecord.contentTypes,
    ),
  };
}

export function buildCampaignCreatorMatches(
  input: BuildCampaignCreatorMatchesInput,
): CampaignCreatorMatchesSnapshot {
  const generatedAt = input.generatedAt ?? new Date();
  const campaignRequirements = extractCampaignMatchRequirements(input.requirements, input.brief);

  const matches = input.candidates
    .map((candidate) =>
      scoreCreatorMatch({
        candidate,
        campaignType: input.campaignType,
        requirements: campaignRequirements,
      }),
    )
    .sort(
      (left, right) =>
        right.score - left.score || left.displayName?.localeCompare(right.displayName ?? '') || 0,
    );

  return {
    campaignId: input.campaignId,
    generatedAt: generatedAt.toISOString(),
    totalCandidates: input.candidates.length,
    matches,
  };
}

export function parseCampaignCreatorMatchesSnapshot(
  campaignId: string,
  metadata: unknown,
): CampaignCreatorMatchesSnapshot | null {
  const record = toMetadataRecord(metadata);
  const snapshot = record[CAMPAIGN_CREATOR_MATCHES_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = CampaignCreatorMatchesSnapshotSchema.safeParse({
    ...snapshot,
    campaignId,
  });

  if (!parsed.success || parsed.data.campaignId !== campaignId) {
    return null;
  }

  return parsed.data;
}

export function deriveCreatorComplianceForMatching(input: {
  performanceScore: CreatorPerformanceScore | null;
  hasApprovedGovernmentId: boolean;
  hasSignedAgreement: boolean;
}): CreatorComplianceOverallStatus {
  if (input.performanceScore) {
    if (input.performanceScore.complianceScore <= 20) {
      return 'NON_COMPLIANT';
    }
    if (input.performanceScore.complianceScore <= 60) {
      return 'AT_RISK';
    }
    return 'COMPLIANT';
  }

  if (!input.hasApprovedGovernmentId || !input.hasSignedAgreement) {
    return 'NON_COMPLIANT';
  }

  return 'AT_RISK';
}

function scoreCreatorMatch(input: {
  candidate: CreatorMatchCandidateInput;
  campaignType: CampaignType;
  requirements: CampaignMatchRequirements;
}): CampaignCreatorMatch {
  const reasons: string[] = [];
  const risks: string[] = [];
  const missingData: string[] = [];
  const skills = getCreatorSkillsFromMetadata(input.candidate.metadata, input.candidate.languages);
  const activePlatforms = input.candidate.platformAccounts
    .filter((account) => account.status !== 'REMOVED')
    .map((account) => account.platform);
  const relevantPlatforms = intersectNormalized(activePlatforms, input.requirements.platforms);
  const relevantSkills = intersectNormalized(
    [...skills.skills, ...skills.categories, ...skills.contentTypes],
    [
      ...input.requirements.skills,
      ...input.requirements.categories,
      ...input.requirements.contentTypes,
    ],
  );

  let score = 40;

  if (input.candidate.performanceScore) {
    score += input.candidate.performanceScore.overallScore * 0.3;
    reasons.push(
      `Stored performance score of ${input.candidate.performanceScore.overallScore} may correlate with campaign readiness.`,
    );
  } else {
    missingData.push('No stored creator performance score was found.');
  }

  if (input.requirements.platforms.length > 0) {
    if (relevantPlatforms.length > 0) {
      score += 12;
      reasons.push(`Platform overlap detected: ${relevantPlatforms.join(', ')}.`);
    } else {
      score -= 12;
      risks.push('Required campaign platforms do not appear to match active creator accounts.');
    }
  } else if (activePlatforms.length > 0) {
    score += 4;
    reasons.push('Creator has active platform accounts available for campaign work.');
  }

  if (relevantSkills.length > 0) {
    score += Math.min(15, relevantSkills.length * 4);
    reasons.push(`Skill or category overlap detected: ${relevantSkills.slice(0, 3).join(', ')}.`);
  }

  if (input.requirements.countries.length > 0 && input.candidate.country) {
    if (
      input.requirements.countries
        .map(normalizeToken)
        .includes(normalizeToken(input.candidate.country))
    ) {
      score += 8;
      reasons.push('Creator country appears to match campaign requirements.');
    } else {
      score -= 4;
      risks.push('Creator country may not match campaign country requirements.');
    }
  }

  const candidateLanguages = [...input.candidate.languages, ...skills.languages];
  const languageOverlap = intersectNormalized(candidateLanguages, input.requirements.languages);
  if (input.requirements.languages.length > 0) {
    if (languageOverlap.length > 0) {
      score += 8;
      reasons.push(`Language overlap detected: ${languageOverlap.join(', ')}.`);
    } else {
      score -= 4;
      risks.push('Creator languages may not match campaign language requirements.');
    }
  }

  if (hasAvailabilityPresent(input.candidate.availability)) {
    score += 6;
    reasons.push('Creator availability is present and may support campaign scheduling.');
  } else {
    missingData.push('Creator availability is missing or empty.');
  }

  if (input.candidate.completedCampaignCount > 0) {
    score += Math.min(10, input.candidate.completedCampaignCount * 3);
    reasons.push(
      `Creator has ${input.candidate.completedCampaignCount} completed campaign assignment(s), which may correlate with execution experience.`,
    );
  }

  score += scoreCampaignTypeFit(input.campaignType, skills.contentTypes, reasons);

  if (input.candidate.liveTrendSnapshot?.overallDirection === 'IMPROVING') {
    score += 8;
    reasons.push('Recent live trends appear to be improving across analyzed sessions.');
  } else if (input.candidate.liveTrendSnapshot?.overallDirection === 'DECLINING') {
    score -= 8;
    risks.push('Recent live trends appear to be declining across analyzed sessions.');
  } else if (!input.candidate.liveTrendSnapshot) {
    missingData.push('No stored live trend snapshot was found.');
  }

  if (input.candidate.complianceStatus === 'NON_COMPLIANT') {
    score = Math.min(score, 25);
    risks.push('Compliance failures strongly reduce match suitability for this campaign.');
  } else if (input.candidate.complianceStatus === 'AT_RISK') {
    score -= 18;
    risks.push('Compliance signals appear at risk and may require review before assignment.');
  } else {
    score += 6;
    reasons.push('Compliance signals appear healthy for campaign participation.');
  }

  const clampedScore = clampMatchScore(score);
  const recommendationBand = deriveRecommendationBand(
    clampedScore,
    input.candidate.complianceStatus,
  );

  return {
    creatorProfileId: input.candidate.creatorProfileId,
    displayName: input.candidate.displayName,
    score: clampedScore,
    recommendationBand,
    reasons: [...new Set(reasons)].slice(0, 6),
    risks: [...new Set(risks)].slice(0, 5),
    missingData: [...new Set(missingData)].slice(0, 5),
    relevantPlatforms,
    relevantSkills: relevantSkills.slice(0, 5),
    performanceScoreSummary: input.candidate.performanceScore
      ? {
          overallScore: input.candidate.performanceScore.overallScore,
          scoreBand: input.candidate.performanceScore.scoreBand,
        }
      : null,
  };
}

function scoreCampaignTypeFit(
  campaignType: CampaignType,
  contentTypes: string[],
  reasons: string[],
): number {
  const normalizedContentTypes = contentTypes.map(normalizeToken);

  switch (campaignType) {
    case 'LIVE_STREAM':
      if (normalizedContentTypes.includes('live')) {
        reasons.push('Live content experience may correlate with live stream campaign work.');
        return 8;
      }
      return 0;
    case 'TIKTOK_SHOP':
      if (normalizedContentTypes.some((type) => ['live', 'commerce', 'shop'].includes(type))) {
        reasons.push(
          'Commerce-oriented content experience may correlate with TikTok Shop campaigns.',
        );
        return 8;
      }
      return 0;
    case 'UGC':
      if (normalizedContentTypes.some((type) => ['short-form', 'ugc', 'video'].includes(type))) {
        reasons.push('UGC-oriented content experience may correlate with this campaign type.');
        return 6;
      }
      return 0;
    default:
      return 0;
  }
}

function deriveRecommendationBand(
  score: number,
  complianceStatus: CreatorComplianceOverallStatus,
): CampaignCreatorMatchBand {
  if (complianceStatus === 'NON_COMPLIANT') {
    return 'NOT_RECOMMENDED';
  }
  if (score >= 80) {
    return 'STRONG_MATCH';
  }
  if (score >= 65) {
    return 'GOOD_MATCH';
  }
  if (score >= 50) {
    return 'POSSIBLE_MATCH';
  }
  if (score >= 35) {
    return 'WEAK_MATCH';
  }
  return 'NOT_RECOMMENDED';
}

function clampMatchScore(value: number): number {
  return clampIntelligenceScore(value);
}

function hasAvailabilityPresent(availability: unknown): boolean {
  if (typeof availability !== 'object' || availability === null || Array.isArray(availability)) {
    return false;
  }

  return Object.keys(availability as Record<string, unknown>).length > 0;
}

function intersectNormalized(left: string[], right: string[]): string[] {
  if (right.length === 0) {
    return [];
  }

  const rightSet = new Set(right.map(normalizeToken));
  return [...new Set(left.filter((value) => rightSet.has(normalizeToken(value))))];
}

function toNormalizedStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter((entry): entry is string => typeof entry === 'string').map(normalizeToken),
    ),
  ];
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}
