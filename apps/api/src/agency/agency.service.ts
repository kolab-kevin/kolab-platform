import type { AccessTokenPayload } from '@kolab/auth';
import {
  type AgencyProfile,
  type AgencySettings,
  MembershipStatus,
  type Organization,
  OrganizationType,
  Prisma,
  prisma,
} from '@kolab/database';
import type {
  AgencyOperationalSettings,
  AgencyProfileFields,
  AgencyProfileResponse,
  AgencySettingsResponse,
  AgencySocialLinks,
  UpdateAgencyProfileInput,
  UpdateAgencySettingsInput,
} from '@kolab/types';
import {
  DEFAULT_AGENCY_OPERATIONAL_SETTINGS as defaultOperationalSettings,
  DEFAULT_AGENCY_PROFILE_FIELDS as defaultProfileFields,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { mergeJsonObjects, toRecord } from './agency.utils';

@Injectable()
export class AgencyService {
  async getProfile(user: AccessTokenPayload): Promise<AgencyProfileResponse> {
    const organization = await this.getAgencyOrganizationForUser(user);
    const profile = await prisma.agencyProfile.findUnique({
      where: { organizationId: organization.id },
    });

    return {
      organization: this.toOrganizationSummary(organization),
      profile: this.toAgencyProfileFields(profile),
      updatedAt: profile?.updatedAt.toISOString() ?? null,
    };
  }

  async updateProfile(
    user: AccessTokenPayload,
    input: UpdateAgencyProfileInput,
  ): Promise<AgencyProfileResponse> {
    const organization = await this.getAgencyOrganizationForUser(user);
    const existing = await prisma.agencyProfile.findUnique({
      where: { organizationId: organization.id },
    });
    const currentProfile = this.toAgencyProfileFields(existing);
    const nextProfile = this.mergeProfileFields(currentProfile, input);
    const profileData = this.toProfileWriteData(nextProfile);

    const profile = await prisma.agencyProfile.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        ...profileData,
      },
      update: profileData,
    });

    return {
      organization: this.toOrganizationSummary(organization),
      profile: this.toAgencyProfileFields(profile),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async getSettings(user: AccessTokenPayload): Promise<AgencySettingsResponse> {
    const organization = await this.getAgencyOrganizationForUser(user);
    const settings = await prisma.agencySettings.findUnique({
      where: { organizationId: organization.id },
    });

    return {
      organization: this.toOrganizationSummary(organization),
      settings: this.toOperationalSettings(settings),
      updatedAt: settings?.updatedAt.toISOString() ?? null,
    };
  }

  async updateSettings(
    user: AccessTokenPayload,
    input: UpdateAgencySettingsInput,
  ): Promise<AgencySettingsResponse> {
    const organization = await this.getAgencyOrganizationForUser(user);
    const existing = await prisma.agencySettings.findUnique({
      where: { organizationId: organization.id },
    });
    const mergedSettings = mergeJsonObjects(
      toRecord(existing?.settings ?? defaultOperationalSettings),
      input as Record<string, unknown>,
    );

    const settings = await prisma.agencySettings.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        settings: mergedSettings as Prisma.InputJsonValue,
      },
      update: {
        settings: mergedSettings as Prisma.InputJsonValue,
      },
    });

    return {
      organization: this.toOrganizationSummary(organization),
      settings: this.toOperationalSettings(settings),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  private async getAgencyOrganizationForUser(user: AccessTokenPayload): Promise<Organization> {
    const organizationId = this.requireOrganizationContext(user);
    await this.assertActiveMembership(user.sub, organizationId);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.type !== OrganizationType.AGENCY) {
      throw new ForbiddenException('Active organization must be of type AGENCY');
    }

    return organization;
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private async assertActiveMembership(userId: string, organizationId: string): Promise<void> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }
  }

  private mergeProfileFields(
    currentProfile: AgencyProfileFields,
    input: UpdateAgencyProfileInput,
  ): AgencyProfileFields {
    return {
      description: input.description !== undefined ? input.description : currentProfile.description,
      logoUrl: input.logoUrl !== undefined ? input.logoUrl : currentProfile.logoUrl,
      website: input.website !== undefined ? input.website : currentProfile.website,
      primaryContact:
        input.primaryContact !== undefined ? input.primaryContact : currentProfile.primaryContact,
      phone: input.phone !== undefined ? input.phone : currentProfile.phone,
      country: input.country !== undefined ? input.country : currentProfile.country,
      timezone: input.timezone !== undefined ? input.timezone : currentProfile.timezone,
      supportedLanguages:
        input.supportedLanguages !== undefined
          ? input.supportedLanguages
          : currentProfile.supportedLanguages,
      socialLinks: input.socialLinks
        ? (mergeJsonObjects(
            currentProfile.socialLinks as Record<string, unknown>,
            input.socialLinks as Record<string, unknown>,
          ) as AgencySocialLinks)
        : currentProfile.socialLinks,
      businessSettings: input.businessSettings
        ? (mergeJsonObjects(
            currentProfile.businessSettings as Record<string, unknown>,
            input.businessSettings as Record<string, unknown>,
          ) as AgencyProfileFields['businessSettings'])
        : currentProfile.businessSettings,
    };
  }

  private toProfileWriteData(profile: AgencyProfileFields) {
    return {
      description: profile.description,
      logoUrl: profile.logoUrl,
      website: profile.website,
      primaryContact: profile.primaryContact,
      phone: profile.phone,
      country: profile.country,
      timezone: profile.timezone,
      supportedLanguages: profile.supportedLanguages,
      socialLinks: profile.socialLinks as Prisma.InputJsonValue,
      businessSettings: profile.businessSettings as Prisma.InputJsonValue,
    };
  }

  private toOrganizationSummary(organization: Organization) {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
    };
  }

  private toAgencyProfileFields(profile: AgencyProfile | null): AgencyProfileFields {
    if (!profile) {
      return { ...defaultProfileFields };
    }

    return {
      description: profile.description,
      logoUrl: profile.logoUrl,
      website: profile.website,
      primaryContact: profile.primaryContact,
      phone: profile.phone,
      country: profile.country,
      timezone: profile.timezone,
      supportedLanguages: profile.supportedLanguages,
      socialLinks: this.toSocialLinks(profile.socialLinks),
      businessSettings: toRecord(profile.businessSettings),
    };
  }

  private toOperationalSettings(settings: AgencySettings | null): AgencyOperationalSettings {
    if (!settings) {
      return { ...defaultOperationalSettings };
    }

    return mergeJsonObjects(
      defaultOperationalSettings as Record<string, unknown>,
      toRecord(settings.settings),
    ) as AgencyOperationalSettings;
  }

  private toSocialLinks(value: AgencyProfile['socialLinks']): AgencySocialLinks {
    const links = toRecord(value);

    return {
      ...(typeof links.tiktok === 'string' ? { tiktok: links.tiktok } : {}),
      ...(typeof links.instagram === 'string' ? { instagram: links.instagram } : {}),
      ...(typeof links.youtube === 'string' ? { youtube: links.youtube } : {}),
      ...(typeof links.linkedin === 'string' ? { linkedin: links.linkedin } : {}),
      ...(typeof links.x === 'string' ? { x: links.x } : {}),
    };
  }
}
