import type { AccessTokenPayload } from '@kolab/auth';
import {
  generateInvitationToken,
  hashInvitationToken,
  hashPassword,
  parseDurationToMs,
} from '@kolab/auth';
import { type Invitation, MembershipStatus, prisma, Role as PrismaRole } from '@kolab/database';
import type {
  AcceptInvitationInput,
  AcceptInvitationResponse,
  CreateInvitationInput,
  CreateInvitationResponse,
  InvitationListQuery,
  InvitationResponse,
  InvitationStatus,
  ListInvitationsResponse,
  RevokeInvitationResponse,
} from '@kolab/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const INVITATION_EXPIRY = '7d';

@Injectable()
export class InvitationService {
  async createInvitation(
    user: AccessTokenPayload,
    input: CreateInvitationInput,
  ): Promise<CreateInvitationResponse> {
    const organizationId = this.requireOrganizationContext(user);
    const email = input.email.toLowerCase().trim();

    await this.assertNotActiveMember(organizationId, email);

    const existingPending = await prisma.invitation.findFirst({
      where: {
        organizationId,
        email,
        acceptedAt: null,
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (existingPending) {
      if (existingPending.expiresAt > new Date()) {
        throw new ConflictException('Pending invitation already exists for this email');
      }

      await prisma.invitation.delete({ where: { id: existingPending.id } });
    }

    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const expiresAt = new Date(Date.now() + parseDurationToMs(INVITATION_EXPIRY));

    const invitation = await prisma.invitation.create({
      data: {
        organizationId,
        email,
        role: input.role,
        tokenHash,
        expiresAt,
        invitedBy: user.sub,
      },
    });

    return {
      invitation: this.toInvitationResponse(invitation),
      token,
    };
  }

  async listInvitations(
    user: AccessTokenPayload,
    query: InvitationListQuery,
  ): Promise<ListInvitationsResponse> {
    const organizationId = this.requireOrganizationContext(user);

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        ...(query.pendingOnly
          ? {
              acceptedAt: null,
              expiresAt: { gt: new Date() },
            }
          : {}),
      },
      orderBy: { expiresAt: 'desc' },
    });

    return {
      invitations: invitations.map((invitation) => this.toInvitationResponse(invitation)),
    };
  }

  async revokeInvitation(
    user: AccessTokenPayload,
    invitationId: string,
  ): Promise<RevokeInvitationResponse> {
    const organizationId = this.requireOrganizationContext(user);

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Accepted invitations cannot be revoked');
    }

    await prisma.invitation.delete({ where: { id: invitationId } });

    return { id: invitationId, revoked: true };
  }

  async acceptInvitation(input: AcceptInvitationInput): Promise<AcceptInvitationResponse> {
    const tokenHash = hashInvitationToken(input.token);

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new UnauthorizedException('Invalid invitation token');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    await this.assertNotActiveMember(invitation.organizationId, invitation.email);

    let existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!existingUser) {
      if (!input.password) {
        throw new BadRequestException('Password is required for new users');
      }

      existingUser = await prisma.user.create({
        data: {
          email: invitation.email,
          passwordHash: await hashPassword(input.password),
          role: PrismaRole.USER,
          profile: input.displayName
            ? {
                create: {
                  displayName: input.displayName,
                },
              }
            : undefined,
        },
      });
    } else if (input.displayName) {
      await prisma.userProfile.upsert({
        where: { userId: existingUser.id },
        create: {
          userId: existingUser.id,
          displayName: input.displayName,
        },
        update: {
          displayName: input.displayName,
        },
      });
    }

    const membership = await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: existingUser.id,
        },
      },
      create: {
        organizationId: invitation.organizationId,
        userId: existingUser.id,
        role: invitation.role,
        status: MembershipStatus.ACTIVE,
        invitedBy: invitation.invitedBy,
      },
      update: {
        role: invitation.role,
        status: MembershipStatus.ACTIVE,
        invitedBy: invitation.invitedBy,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return {
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      membershipStatus: membership.status,
    };
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private async assertNotActiveMember(organizationId: string, email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
    });

    if (membership?.status === MembershipStatus.ACTIVE) {
      throw new ConflictException('User is already an active member of this organization');
    }
  }

  private toInvitationResponse(invitation: Invitation): InvitationResponse {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      status: this.deriveInvitationStatus(invitation),
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      invitedBy: invitation.invitedBy,
    };
  }

  private deriveInvitationStatus(invitation: Invitation): InvitationStatus {
    if (invitation.acceptedAt) {
      return 'ACCEPTED';
    }

    if (invitation.expiresAt <= new Date()) {
      return 'EXPIRED';
    }

    return 'PENDING';
  }
}
