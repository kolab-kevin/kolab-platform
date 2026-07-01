import type { AccessTokenPayload } from '@kolab/auth';
import { prisma, type User, type UserProfile } from '@kolab/database';
import type { ProfileResponse, UpdateProfileInput, UserProfileFields } from '@kolab/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';

const DEFAULT_PROFILE_FIELDS: UserProfileFields = {
  displayName: null,
  avatarUrl: null,
  bio: null,
  language: 'en',
  timezone: 'UTC',
  country: null,
};

@Injectable()
export class ProfileService {
  constructor(private readonly auditService: AuditService) {}

  async getProfile(user: AccessTokenPayload): Promise<ProfileResponse> {
    const account = await this.getUserAccountOrThrow(user.sub);

    return {
      user: this.toUserAccountInfo(account),
      profile: this.toProfileFields(account.profile),
    };
  }

  async updateProfile(
    user: AccessTokenPayload,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    const account = await this.getUserAccountOrThrow(user.sub);
    const previousProfile = this.toProfileFields(account.profile);
    const updateData = this.buildUpdateData(input);

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.sub },
      create: {
        userId: user.sub,
        language: input.language ?? DEFAULT_PROFILE_FIELDS.language,
        timezone: input.timezone ?? DEFAULT_PROFILE_FIELDS.timezone,
        ...updateData,
      },
      update: updateData,
    });

    await this.auditService.record({
      organizationId: user.organizationId ?? null,
      actorUserId: user.sub,
      action: AUDIT_ACTION.PROFILE_UPDATED,
      targetType: AUDIT_TARGET_TYPE.PROFILE,
      targetId: user.sub,
      metadata: {
        changedFields: Object.keys(updateData),
        previous: this.pickChangedFields(previousProfile, updateData),
        next: this.pickChangedFields(this.toProfileFields(profile), updateData),
      },
    });

    const refreshedAccount = await prisma.user.findUnique({
      where: { id: user.sub },
      include: { profile: true },
    });

    if (!refreshedAccount) {
      throw new NotFoundException('User not found');
    }

    return {
      user: this.toUserAccountInfo(refreshedAccount),
      profile: this.toProfileFields(refreshedAccount.profile),
    };
  }

  private async getUserAccountOrThrow(
    userId: string,
  ): Promise<User & { profile: UserProfile | null }> {
    const account = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return account;
  }

  private buildUpdateData(input: UpdateProfileInput): Partial<UserProfile> {
    const updateData: Partial<UserProfile> = {};

    if (input.displayName !== undefined) {
      updateData.displayName = input.displayName;
    }
    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl;
    }
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }
    if (input.language !== undefined) {
      updateData.language = input.language;
    }
    if (input.timezone !== undefined) {
      updateData.timezone = input.timezone;
    }
    if (input.country !== undefined) {
      updateData.country = input.country;
    }

    return updateData;
  }

  private pickChangedFields(
    profile: UserProfileFields,
    updateData: Partial<UserProfile>,
  ): Record<string, string | null> {
    const changed: Record<string, string | null> = {};

    for (const key of Object.keys(updateData) as (keyof UserProfileFields)[]) {
      changed[key] = profile[key];
    }

    return changed;
  }

  private toUserAccountInfo(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isSystemAdmin: user.isSystemAdmin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toProfileFields(profile: UserProfile | null): UserProfileFields {
    if (!profile) {
      return { ...DEFAULT_PROFILE_FIELDS };
    }

    return {
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      language: profile.language,
      timezone: profile.timezone,
      country: profile.country,
    };
  }
}
