import type { AccessTokenPayload } from '@kolab/auth';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreatorsOnboardingService } from './creators-onboarding.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
    },
    creatorDocument: {
      findFirst: jest.fn(),
    },
    creatorContract: {
      findFirst: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
}));

import { prisma } from '@kolab/database';

const managerToken: AccessTokenPayload = {
  sub: 'manager-1',
  email: 'manager@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'AGENCY_MANAGER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const viewerToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'viewer-1',
  organizationRole: 'VIEWER',
};

const completeProfile = {
  id: 'creator-1',
  organizationId: 'org-1',
  displayName: 'Jane Creator',
  country: 'US',
  availability: { timezone: 'America/New_York' },
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
};

describe('CreatorsOnboardingService', () => {
  let service: CreatorsOnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsOnboardingService],
    }).compile();

    service = module.get(CreatorsOnboardingService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
  });

  it('returns a complete onboarding checklist', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(completeProfile);
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      status: 'APPROVED',
    });
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      id: 'contract-1',
      status: 'SIGNED',
      signedAt: new Date('2026-07-02T14:00:00.000Z'),
    });

    const result = await service.getCreatorOnboarding(managerToken, 'creator-1');

    expect(result.creatorId).toBe('creator-1');
    expect(result.organizationId).toBe('org-1');
    expect(result.overallStatus).toBe('COMPLETE');
    expect(result.items).toHaveLength(6);
  });

  it('returns incomplete when government ID is missing', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(completeProfile);
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      id: 'contract-1',
      status: 'SIGNED',
      signedAt: new Date('2026-07-02T14:00:00.000Z'),
    });

    const result = await service.getCreatorOnboarding(managerToken, 'creator-1');

    expect(result.overallStatus).toBe('INCOMPLETE');
    expect(result.items.find((item) => item.key === 'government_id_approved')?.status).toBe(
      'INCOMPLETE',
    );
  });

  it('returns warning when optional onboarding items are missing', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
      ...completeProfile,
      availability: {},
      metadata: {},
      platformAccounts: [],
    });
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      status: 'APPROVED',
    });
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      id: 'contract-1',
      status: 'SIGNED',
      signedAt: new Date('2026-07-02T14:00:00.000Z'),
    });

    const result = await service.getCreatorOnboarding(managerToken, 'creator-1');

    expect(result.overallStatus).toBe('WARNING');
  });

  it('enforces organization isolation', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getCreatorOnboarding(otherOrgToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getCreatorOnboarding(viewerToken, 'creator-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
