import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreatorsReportingService } from './creators-reporting.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    creatorDocument: {
      findMany: jest.fn(),
    },
    creatorContract: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
  CreatorDocumentStatus: {
    APPROVED: 'APPROVED',
  },
  CreatorStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
}));

import type { AccessTokenPayload } from '@kolab/auth';
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

const baseCreatorProfile = {
  id: 'creator-1',
  organizationId: 'org-1',
  userId: 'user-1',
  sourceLeadId: 'lead-1',
  displayName: 'Jane Creator',
  country: 'US',
  languages: ['en'],
  recruiterUserId: 'recruiter-1',
  status: 'ACTIVE',
  platformAccounts: [],
  sourceLead: { email: 'jane@kolab.test' },
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};

const baseExpiringDocumentsQuery = {
  days: 30,
  includeExpired: false,
  limit: 20,
};

const baseExpiringContractsQuery = {
  days: 30,
  includeExpired: false,
  limit: 20,
};

const expiringDocument = {
  id: 'doc-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  sourceLeadId: 'lead-1',
  documentType: 'GOVERNMENT_ID',
  status: 'APPROVED',
  title: null,
  expiresAt: new Date('2026-08-01T00:00:00.000Z'),
  reviewedById: null,
  reviewedAt: null,
  rejectionReason: null,
  metadata: {},
  deletedAt: null,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  creatorProfile: baseCreatorProfile,
};

const expiredDocument = {
  ...expiringDocument,
  id: 'doc-2',
  expiresAt: new Date('2026-06-01T00:00:00.000Z'),
};

const expiringContract = {
  id: 'contract-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  sourceLeadId: 'lead-1',
  contractType: 'CREATOR_AGREEMENT',
  status: 'SIGNED',
  title: '2026 Creator Agreement',
  parentContractId: null,
  validFrom: null,
  validUntil: new Date('2026-08-15T00:00:00.000Z'),
  signedAt: new Date('2026-07-01T00:00:00.000Z'),
  signedByUserId: 'manager-1',
  externalEnvelopeId: null,
  metadata: {},
  deletedAt: null,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  creatorProfile: baseCreatorProfile,
};

describe('CreatorsReportingService', () => {
  let service: CreatorsReportingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsReportingService],
    }).compile();

    service = module.get(CreatorsReportingService);
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-02T12:00:00.000Z'));

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1', status: 'ACTIVE' },
    ]);
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lists expiring documents within the configured window', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([expiringDocument]);

    const result = await service.listExpiringDocuments(managerToken, baseExpiringDocumentsQuery);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('EXPIRING');
    expect(result.items[0].creator.id).toBe('creator-1');
    expect(prisma.creatorDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
        }),
      }),
    );
  });

  it('includes expired documents when includeExpired is true', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([
      expiredDocument,
      expiringDocument,
    ]);

    const result = await service.listExpiringDocuments(managerToken, {
      ...baseExpiringDocumentsQuery,
      includeExpired: true,
    });

    expect(result.items.map((item) => item.status)).toEqual(['EXPIRED', 'EXPIRING']);
    expect(prisma.creatorDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('excludes expired documents by default', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([expiringDocument]);

    await service.listExpiringDocuments(managerToken, baseExpiringDocumentsQuery);

    expect(prisma.creatorDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({
            gte: new Date('2026-07-02T12:00:00.000Z'),
          }),
        }),
      }),
    );
  });

  it('lists creators missing required GOVERNMENT_ID documents', async () => {
    (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([
      baseCreatorProfile,
      { ...baseCreatorProfile, id: 'creator-2', userId: 'user-2', displayName: 'John Creator' },
    ]);
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([
      {
        creatorProfileId: 'creator-2',
        documentType: 'GOVERNMENT_ID',
      },
    ]);

    const result = await service.listMissingDocuments(managerToken, { limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('MISSING');
    expect(result.items[0].documentType).toBe('GOVERNMENT_ID');
    expect(result.items[0].creator.id).toBe('creator-1');
  });

  it('lists expiring contracts within the configured window', async () => {
    (prisma.creatorContract.findMany as jest.Mock).mockResolvedValue([expiringContract]);

    const result = await service.listExpiringContracts(managerToken, baseExpiringContractsQuery);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('EXPIRING');
    expect(result.items[0].contract.id).toBe('contract-1');
  });

  it('applies documentType and contractType filters', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.creatorContract.findMany as jest.Mock).mockResolvedValue([]);

    await service.listExpiringDocuments(managerToken, {
      ...baseExpiringDocumentsQuery,
      documentType: 'PASSPORT',
    });
    await service.listExpiringContracts(managerToken, {
      ...baseExpiringContractsQuery,
      contractType: 'NDA',
    });

    expect(prisma.creatorDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ documentType: 'PASSPORT' }),
      }),
    );
    expect(prisma.creatorContract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ contractType: 'NDA' }),
      }),
    );
  });

  it('paginates expiring documents with cursor', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([
      expiringDocument,
      { ...expiringDocument, id: 'doc-3' },
    ]);

    const result = await service.listExpiringDocuments(managerToken, {
      ...baseExpiringDocumentsQuery,
      limit: 1,
    });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe('doc-1');
  });

  it('paginates missing documents with composite cursor', async () => {
    (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([baseCreatorProfile]);
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.listMissingDocuments(managerToken, { limit: 20 });

    expect(result.items[0].status).toBe('MISSING');
    expect(result.nextCursor).toBeNull();
  });

  it('enforces organization isolation via scoped queries', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([]);

    await service.listExpiringDocuments(otherOrgToken, baseExpiringDocumentsQuery);

    expect(prisma.creatorDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-2',
        }),
      }),
    );
  });

  it('returns not found when filtering by creator outside the organization', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.listExpiringDocuments(managerToken, {
        ...baseExpiringDocumentsQuery,
        creatorId: 'creator-other',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.listExpiringDocuments(managerToken, baseExpiringDocumentsQuery),
    ).rejects.toThrow(ForbiddenException);
  });
});
