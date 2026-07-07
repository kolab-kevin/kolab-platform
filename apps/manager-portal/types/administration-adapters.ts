import type {
  AgencyOperationalSettings,
  AgencyProfileFields,
  AuditLogResponse,
  InvitationResponse,
  Organization,
  OrganizationMember,
} from '@kolab/types';

import {
  buildIntegrationsPresentation,
  buildMockIntegrations,
} from '@/services/integration-service';
import { buildRolesPermissions } from '@/services/rbac-service';
import { buildSystemHealth } from '@/services/system-health-service';
import type {
  ManagerAdministrationWorkspace,
  ManagerAuditCenter,
  ManagerAuditEntry,
  ManagerOrganizationProfile,
  ManagerOrganizationSettings,
  ManagerUserManagement,
} from '@/types/administration-workspace';

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function roleLabel(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapAuditEntry(entry: AuditLogResponse): ManagerAuditEntry {
  const category = entry.action.includes('member')
    ? 'Administration'
    : entry.action.includes('session') || entry.action.includes('auth')
      ? 'Security'
      : 'System';

  return {
    id: entry.id,
    action: entry.action.replace(/[._]/g, ' '),
    actorLabel: entry.actorUserId ?? 'System',
    targetLabel: `${entry.targetType} · ${entry.targetId}`,
    timestampLabel: formatTimestamp(entry.createdAt),
    category,
  };
}

export function buildOrganizationProfile(input: {
  organization: Organization | null;
  agencyProfile: AgencyProfileFields | null;
  members: OrganizationMember[];
  invitations: InvitationResponse[];
}): ManagerOrganizationProfile {
  const organization = input.organization;
  const profile = input.agencyProfile;
  const activeMembers = input.members.filter((member) => member.status === 'ACTIVE').length;
  const pendingInvitations = input.invitations.filter(
    (invitation) => invitation.status === 'PENDING',
  ).length;

  return {
    name: organization?.name ?? profile?.primaryContact ?? 'Organization',
    logoUrl: profile?.logoUrl ?? null,
    contactName: profile?.primaryContact ?? null,
    contactEmail: null,
    phone: profile?.phone ?? null,
    timezone: profile?.timezone ?? 'UTC',
    region: profile?.country ?? organization?.settings?.region?.toString() ?? 'Global',
    subscriptionTier: organization?.type === 'ENTERPRISE' ? 'Enterprise' : 'Agency Standard',
    statistics: [
      { label: 'Team members', value: String(input.members.length) },
      { label: 'Active members', value: String(activeMembers) },
      { label: 'Pending invitations', value: String(pendingInvitations) },
      { label: 'Organization status', value: organization?.status ?? 'ACTIVE' },
    ],
  };
}

export function buildUserManagement(input: {
  members: OrganizationMember[];
  invitations: InvitationResponse[];
}): ManagerUserManagement {
  return {
    users: input.members.map((member) => ({
      id: member.userId,
      displayName: member.displayName ?? member.email.split('@')[0] ?? member.email,
      email: member.email,
      role: roleLabel(member.role),
      status: member.status,
      lastLoginLabel: `Joined ${formatDate(member.joinedAt)}`,
    })),
    invitations: input.invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: roleLabel(invitation.role),
      status: invitation.status,
      expiresLabel: formatDate(invitation.expiresAt),
    })),
  };
}

export function buildOrganizationSettings(input: {
  agencyProfile: AgencyProfileFields | null;
  agencySettings: AgencyOperationalSettings | null;
}): ManagerOrganizationSettings {
  const profile = input.agencyProfile;
  const settings = input.agencySettings;

  return {
    general: [
      { label: 'Timezone', value: profile?.timezone ?? 'UTC' },
      { label: 'Default locale', value: profile?.businessSettings?.defaultLocale ?? 'en' },
      { label: 'Default currency', value: profile?.businessSettings?.defaultCurrency ?? 'USD' },
      { label: 'Website', value: profile?.website ?? 'Not configured' },
    ],
    notifications: [
      { label: 'Member invitations', value: 'Email alerts enabled (placeholder)' },
      { label: 'Security events', value: 'Admin digest daily (placeholder)' },
      { label: 'Audit exports', value: 'Weekly summary (placeholder)' },
    ],
    branding: [
      { label: 'Logo', value: profile?.logoUrl ? 'Configured' : 'Not configured' },
      { label: 'Description', value: profile?.description ?? 'Not configured' },
      {
        label: 'Supported languages',
        value: profile?.supportedLanguages?.join(', ') ?? 'en',
      },
    ],
    featureFlags: [
      {
        key: 'campaigns',
        label: 'Campaign operations',
        enabled: settings?.campaigns?.enabled ?? false,
        readOnly: true,
      },
      {
        key: 'livestream',
        label: 'Live operations',
        enabled: settings?.livestream?.enabled ?? false,
        readOnly: true,
      },
      {
        key: 'analytics',
        label: 'Reporting & analytics',
        enabled: settings?.analytics?.enabled ?? false,
        readOnly: true,
      },
      {
        key: 'messaging',
        label: 'Team messaging',
        enabled: settings?.messaging?.enabled ?? false,
        readOnly: true,
      },
    ],
    regional: [
      { label: 'Country', value: profile?.country ?? 'Not configured' },
      { label: 'Timezone', value: profile?.timezone ?? 'UTC' },
      {
        label: 'Languages',
        value: profile?.supportedLanguages?.join(', ') ?? 'en',
      },
    ],
  };
}

export function buildAuditCenter(auditLogs: AuditLogResponse[]): ManagerAuditCenter {
  const entries = auditLogs.map(mapAuditEntry);

  return {
    auditLog: entries.slice(0, 12),
    recentAdminActions: entries.filter((entry) => entry.category === 'Administration').slice(0, 6),
    securityEvents: entries.filter((entry) => entry.category === 'Security').slice(0, 6),
  };
}

export function buildAdministrationWorkspace(input: {
  organizationId: string;
  organization: Organization | null;
  agencyProfile: AgencyProfileFields | null;
  agencySettings: AgencyOperationalSettings | null;
  members: OrganizationMember[];
  invitations: InvitationResponse[];
  auditLogs: AuditLogResponse[];
  partial: boolean;
  apiReachable: boolean;
  useMockIntegrations?: boolean;
}): ManagerAdministrationWorkspace {
  return {
    organizationId: input.organizationId,
    generatedAt: new Date().toISOString(),
    organizationProfile: buildOrganizationProfile({
      organization: input.organization,
      agencyProfile: input.agencyProfile,
      members: input.members,
      invitations: input.invitations,
    }),
    userManagement: buildUserManagement({
      members: input.members,
      invitations: input.invitations,
    }),
    rolesPermissions: buildRolesPermissions(input.members),
    organizationSettings: buildOrganizationSettings({
      agencyProfile: input.agencyProfile,
      agencySettings: input.agencySettings,
    }),
    auditCenter: buildAuditCenter(input.auditLogs),
    systemHealth: buildSystemHealth({
      apiReachable: input.apiReachable,
      partial: input.partial,
    }),
    integrations: input.useMockIntegrations
      ? buildMockIntegrations()
      : buildIntegrationsPresentation(),
  };
}
