import type { AccessTokenPayload } from '@kolab/auth';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreatorsComplianceService } from './creators-compliance.service';
import { CreatorsOnboardingService } from './creators-onboarding.service';
import { CreatorsReportingService } from './creators-reporting.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
    },
    creatorDocument: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  CreatorStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
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

const completeOnboarding = {
  creatorId: 'creator-1',
  organizationId: 'org-1',
  overallStatus: 'COMPLETE' as const,
  items: [],
};

describe('CreatorsComplianceService', () => {
  let service: CreatorsComplianceService;
  let onboardingService: jest.Mocked<CreatorsOnboardingService>;
  let reportingService: jest.Mocked<CreatorsReportingService>;

  beforeEach(async () => {
    onboardingService = {
      getCreatorOnboarding: jest.fn(),
    } as unknown as jest.Mocked<CreatorsOnboardingService>;

    reportingService = {
      listMissingDocuments: jest.fn(),
      listExpiringDocuments: jest.fn(),
      listExpiringContracts: jest.fn(),
    } as unknown as jest.Mocked<CreatorsReportingService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsComplianceService,
        { provide: CreatorsOnboardingService, useValue: onboardingService },
        { provide: CreatorsReportingService, useValue: reportingService },
      ],
    }).compile();

    service = module.get(CreatorsComplianceService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({ id: 'creator-1' });
  });

  it('aggregates onboarding, reporting, and sensitive access into a compliance bundle', async () => {
    onboardingService.getCreatorOnboarding.mockResolvedValue(completeOnboarding);
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([
      { documentType: 'GOVERNMENT_ID' },
      { documentType: 'PROFILE_PHOTO' },
    ]);

    const result = await service.getCreatorCompliance(managerToken, 'creator-1', {
      days: 30,
      includeExpired: true,
      limit: 20,
    });

    expect(result.creatorId).toBe('creator-1');
    expect(result.overallStatus).toBe('COMPLIANT');
    expect(result.onboarding).toEqual(completeOnboarding);
    expect(result.documents).toEqual({
      missing: 0,
      expiring: 0,
      expired: 0,
      missingItems: [],
      expiringItems: [],
    });
    expect(result.sensitiveAccess).toEqual({
      sensitiveDocumentTypes: ['GOVERNMENT_ID'],
      downloadRequiresPermission: 'documents:download_sensitive',
      callerCanDownloadSensitive: true,
    });
    expect(result.contracts).toEqual({
      expiring: 0,
      expired: 0,
      expiringItems: [],
    });
  });

  it('returns NON_COMPLIANT when missing documents are reported', async () => {
    onboardingService.getCreatorOnboarding.mockResolvedValue(completeOnboarding);
    reportingService.listMissingDocuments.mockResolvedValue({
      items: [
        {
          status: 'MISSING',
          creator: {
            id: 'creator-1',
            organizationId: 'org-1',
            userId: 'user-1',
            displayName: 'Jane Creator',
            email: null,
            country: 'US',
            languages: ['en'],
            assignedRecruiterId: null,
            status: 'ACTIVE',
            platformCount: 0,
            createdAt: '2026-06-28T12:00:00.000Z',
            updatedAt: '2026-06-28T12:00:00.000Z',
          },
          documentType: 'GOVERNMENT_ID',
        },
      ],
      nextCursor: null,
    });
    reportingService.listExpiringDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.getCreatorCompliance(managerToken, 'creator-1', {
      days: 30,
      includeExpired: true,
      limit: 20,
    });

    expect(result.overallStatus).toBe('NON_COMPLIANT');
    expect(result.documents.missing).toBe(1);
  });

  it('enforces organization isolation for inactive or unknown creators', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getCreatorCompliance(otherOrgToken, 'creator-1', {
        days: 30,
        includeExpired: true,
        limit: 20,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getCreatorCompliance(managerToken, 'creator-1', {
        days: 30,
        includeExpired: true,
        limit: 20,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
