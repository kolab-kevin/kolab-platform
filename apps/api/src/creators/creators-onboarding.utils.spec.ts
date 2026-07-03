import { buildCreatorOnboardingChecklist } from './creators-onboarding.utils';

const baseSource = {
  creatorId: 'creator-1',
  organizationId: 'org-1',
  displayName: 'Jane Creator',
  country: 'US',
  availability: {
    timezone: 'America/New_York',
    weeklySchedule: [{ weekday: 1, start: '09:00', end: '17:00' }],
  },
  metadata: {
    skills: {
      categories: ['beauty'],
      skills: ['makeup'],
    },
  },
  platformAccounts: [
    {
      id: 'account-1',
      status: 'ACTIVE',
      platform: 'TIKTOK',
      username: 'janecreates',
    },
  ],
  governmentIdDocument: {
    id: 'doc-1',
    status: 'APPROVED',
  },
  creatorAgreement: {
    id: 'contract-1',
    status: 'SIGNED',
    signedAt: new Date('2026-07-02T14:00:00.000Z'),
  },
};

describe('buildCreatorOnboardingChecklist', () => {
  it('returns a complete checklist when all items are satisfied', () => {
    const result = buildCreatorOnboardingChecklist(baseSource);

    expect(result.overallStatus).toBe('COMPLETE');
    expect(result.items).toHaveLength(6);
    expect(result.items.every((item) => item.status === 'COMPLETE')).toBe(true);
  });

  it('marks government ID as incomplete when no approved document exists', () => {
    const result = buildCreatorOnboardingChecklist({
      ...baseSource,
      governmentIdDocument: null,
    });

    expect(result.overallStatus).toBe('INCOMPLETE');
    expect(result.items.find((item) => item.key === 'government_id_approved')).toMatchObject({
      status: 'INCOMPLETE',
      required: true,
    });
  });

  it('marks creator agreement as incomplete when no signed contract exists', () => {
    const result = buildCreatorOnboardingChecklist({
      ...baseSource,
      creatorAgreement: {
        id: 'contract-1',
        status: 'SENT',
        signedAt: null,
      },
    });

    expect(result.overallStatus).toBe('INCOMPLETE');
    expect(result.items.find((item) => item.key === 'creator_agreement_signed')).toMatchObject({
      status: 'INCOMPLETE',
    });
  });

  it('marks profile complete as incomplete when displayName or country is missing', () => {
    const result = buildCreatorOnboardingChecklist({
      ...baseSource,
      displayName: 'Jane Creator',
      country: null,
    });

    expect(result.overallStatus).toBe('INCOMPLETE');
    expect(result.items.find((item) => item.key === 'profile_complete')).toMatchObject({
      status: 'INCOMPLETE',
      details: expect.objectContaining({
        missingFields: ['country'],
      }),
    });
  });

  it('marks platform account as warning when no active accounts exist', () => {
    const result = buildCreatorOnboardingChecklist({
      ...baseSource,
      platformAccounts: [],
    });

    expect(result.overallStatus).toBe('WARNING');
    expect(result.items.find((item) => item.key === 'platform_account_present')).toMatchObject({
      status: 'WARNING',
      required: false,
    });
  });

  it('returns warning when required items are complete but optional items are missing', () => {
    const result = buildCreatorOnboardingChecklist({
      ...baseSource,
      availability: {},
      metadata: {},
      platformAccounts: [
        {
          id: 'account-1',
          status: 'REMOVED',
          platform: 'TIKTOK',
          username: 'janecreates',
        },
      ],
    });

    expect(result.overallStatus).toBe('WARNING');
    expect(result.items.find((item) => item.key === 'availability_present')?.status).toBe(
      'WARNING',
    );
    expect(result.items.find((item) => item.key === 'skills_present')?.status).toBe('WARNING');
  });
});
