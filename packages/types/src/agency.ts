import { z } from 'zod';

import { OrganizationSummarySchema } from './organization';

export const AgencySocialLinksSchema = z
  .object({
    tiktok: z.string().url().max(2048).optional(),
    instagram: z.string().url().max(2048).optional(),
    youtube: z.string().url().max(2048).optional(),
    linkedin: z.string().url().max(2048).optional(),
    x: z.string().url().max(2048).optional(),
  })
  .strict();

export type AgencySocialLinks = z.infer<typeof AgencySocialLinksSchema>;

export const AgencyBusinessSettingsSchema = z
  .object({
    defaultCurrency: z.string().length(3).optional(),
    defaultLocale: z.string().min(2).max(10).optional(),
    taxId: z.string().max(50).optional(),
  })
  .passthrough();

export type AgencyBusinessSettings = z.infer<typeof AgencyBusinessSettingsSchema>;

export const AgencyProfileFieldsSchema = z.object({
  description: z.string().max(2000).nullable(),
  logoUrl: z.string().url().max(2048).nullable(),
  website: z.string().url().max(2048).nullable(),
  primaryContact: z.string().max(255).nullable(),
  phone: z.string().max(50).nullable(),
  country: z.string().length(2).nullable(),
  timezone: z.string().min(1).max(64),
  supportedLanguages: z.array(z.string().min(2).max(10)).min(1),
  socialLinks: AgencySocialLinksSchema,
  businessSettings: AgencyBusinessSettingsSchema,
});

export type AgencyProfileFields = z.infer<typeof AgencyProfileFieldsSchema>;

export const AgencyProfileResponseSchema = z.object({
  organization: OrganizationSummarySchema,
  profile: AgencyProfileFieldsSchema,
  updatedAt: z.string().datetime().nullable(),
});

export type AgencyProfileResponse = z.infer<typeof AgencyProfileResponseSchema>;

export const UpdateAgencyProfileSchema = z
  .object({
    description: z.string().max(2000).nullable().optional(),
    logoUrl: z.string().url().max(2048).nullable().optional(),
    website: z.string().url().max(2048).nullable().optional(),
    primaryContact: z.string().max(255).nullable().optional(),
    phone: z.string().max(50).nullable().optional(),
    country: z.string().length(2).nullable().optional(),
    timezone: z.string().min(1).max(64).optional(),
    supportedLanguages: z.array(z.string().min(2).max(10)).min(1).optional(),
    socialLinks: AgencySocialLinksSchema.optional(),
    businessSettings: AgencyBusinessSettingsSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one profile field must be provided',
  });

export type UpdateAgencyProfileInput = z.infer<typeof UpdateAgencyProfileSchema>;

export const AgencyOnboardingSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    requireCreatorApproval: z.boolean().optional(),
  })
  .passthrough();

export const AgencyRecruitingSettingsSchema = z
  .object({
    autoAssignRecruiter: z.boolean().optional(),
    defaultRecruiterRole: z.string().optional(),
  })
  .passthrough();

export const AgencyFeatureToggleSchema = z
  .object({
    enabled: z.boolean().optional(),
  })
  .passthrough();

export const AgencyOperationalSettingsSchema = z
  .object({
    onboarding: AgencyOnboardingSettingsSchema.optional(),
    recruiting: AgencyRecruitingSettingsSchema.optional(),
    campaigns: AgencyFeatureToggleSchema.optional(),
    livestream: AgencyFeatureToggleSchema.optional(),
    tiktokShop: AgencyFeatureToggleSchema.optional(),
    payments: AgencyFeatureToggleSchema.optional(),
    analytics: AgencyFeatureToggleSchema.optional(),
    messaging: AgencyFeatureToggleSchema.optional(),
    extensions: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type AgencyOperationalSettings = z.infer<typeof AgencyOperationalSettingsSchema>;

export const AgencySettingsResponseSchema = z.object({
  organization: OrganizationSummarySchema,
  settings: AgencyOperationalSettingsSchema,
  updatedAt: z.string().datetime().nullable(),
});

export type AgencySettingsResponse = z.infer<typeof AgencySettingsResponseSchema>;

export const UpdateAgencySettingsSchema = AgencyOperationalSettingsSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one settings field must be provided' },
);

export type UpdateAgencySettingsInput = z.infer<typeof UpdateAgencySettingsSchema>;

export const DEFAULT_AGENCY_PROFILE_FIELDS: AgencyProfileFields = {
  description: null,
  logoUrl: null,
  website: null,
  primaryContact: null,
  phone: null,
  country: null,
  timezone: 'UTC',
  supportedLanguages: ['en'],
  socialLinks: {},
  businessSettings: {},
};

export const DEFAULT_AGENCY_OPERATIONAL_SETTINGS: AgencyOperationalSettings = {
  onboarding: {
    enabled: true,
    requireCreatorApproval: false,
  },
  recruiting: {
    autoAssignRecruiter: false,
    defaultRecruiterRole: 'RECRUITER',
  },
  campaigns: { enabled: false },
  livestream: { enabled: false },
  tiktokShop: { enabled: false },
  payments: { enabled: false },
  analytics: { enabled: false },
  messaging: { enabled: false },
  extensions: {},
};
