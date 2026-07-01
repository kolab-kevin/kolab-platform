import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AgencyService } from './agency.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    agencyProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    agencySettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  OrganizationType: {
    STANDARD: 'STANDARD',
    AGENCY: 'AGENCY',
    CREATOR: 'CREATOR',
    MERCHANT: 'MERCHANT',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';
import { UpdateAgencyProfileSchema, UpdateAgencySettingsSchema } from '@kolab/types';

const agencyOrganization = {
  id: 'org-agency-1',
  name: 'Acme Agency',
  slug: 'acme-agency',
  type: 'AGENCY',
  status: 'ACTIVE',
  settings: {},
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const agencyToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'admin@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-agency-1',
  organizationRole: 'ORG_OWNER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

describe('AgencyService', () => {
  let service: AgencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgencyService],
    }).compile();

    service = module.get(AgencyService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
  });

  describe('getProfile', () => {
    it('returns default profile fields when agency profile is missing', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(agencyOrganization);
      (prisma.agencyProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getProfile(agencyToken);

      expect(result.organization.slug).toBe('acme-agency');
      expect(result.profile.timezone).toBe('UTC');
      expect(result.profile.supportedLanguages).toEqual(['en']);
      expect(result.updatedAt).toBeNull();
    });

    it('rejects non-agency organizations', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        ...agencyOrganization,
        type: 'STANDARD',
      });

      await expect(service.getProfile(agencyToken)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProfile', () => {
    it('upserts agency profile fields', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(agencyOrganization);
      (prisma.agencyProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.agencyProfile.upsert as jest.Mock).mockResolvedValue({
        organizationId: 'org-agency-1',
        description: 'Full-service creator agency',
        logoUrl: 'https://cdn.example.com/logo.png',
        website: 'https://acme.example.com',
        primaryContact: 'ops@acme.example.com',
        phone: '+15551234567',
        country: 'US',
        timezone: 'America/New_York',
        supportedLanguages: ['en', 'es'],
        socialLinks: { tiktok: 'https://tiktok.com/@acme' },
        businessSettings: { defaultCurrency: 'USD' },
        updatedAt: new Date('2026-06-28T10:00:00.000Z'),
      });

      const result = await service.updateProfile(agencyToken, {
        description: 'Full-service creator agency',
        timezone: 'America/New_York',
        supportedLanguages: ['en', 'es'],
        socialLinks: { tiktok: 'https://tiktok.com/@acme' },
        businessSettings: { defaultCurrency: 'USD' },
      });

      expect(result.profile.description).toBe('Full-service creator agency');
      expect(prisma.agencyProfile.upsert).toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('returns default operational settings', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(agencyOrganization);
      (prisma.agencySettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getSettings(agencyToken);

      expect(result.settings.onboarding?.enabled).toBe(true);
      expect(result.settings.campaigns?.enabled).toBe(false);
    });

    it('merges operational settings updates', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(agencyOrganization);
      (prisma.agencySettings.findUnique as jest.Mock).mockResolvedValue({
        organizationId: 'org-agency-1',
        settings: {
          onboarding: { enabled: true, requireCreatorApproval: false },
        },
        updatedAt: new Date('2026-06-28T09:00:00.000Z'),
      });
      (prisma.agencySettings.upsert as jest.Mock).mockResolvedValue({
        organizationId: 'org-agency-1',
        settings: {
          onboarding: { enabled: true, requireCreatorApproval: true },
          recruiting: { autoAssignRecruiter: true },
        },
        updatedAt: new Date('2026-06-28T10:00:00.000Z'),
      });

      const result = await service.updateSettings(agencyToken, {
        onboarding: { requireCreatorApproval: true },
        recruiting: { autoAssignRecruiter: true },
      });

      expect(result.settings.onboarding?.requireCreatorApproval).toBe(true);
      expect(result.settings.recruiting?.autoAssignRecruiter).toBe(true);
    });
  });

  describe('validation schemas', () => {
    it('rejects empty profile updates', () => {
      expect(UpdateAgencyProfileSchema.safeParse({}).success).toBe(false);
    });

    it('rejects empty settings updates', () => {
      expect(UpdateAgencySettingsSchema.safeParse({}).success).toBe(false);
    });
  });
});
