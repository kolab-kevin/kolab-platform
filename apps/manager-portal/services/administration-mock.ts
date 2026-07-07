import { buildAdministrationWorkspace } from '@/types/administration-adapters';
import type { ManagerAdministrationWorkspace } from '@/types/administration-workspace';

export function createMockAdministrationWorkspace(
  organizationId: string,
): ManagerAdministrationWorkspace {
  const members = [
    {
      organizationId,
      userId: 'user_owner_001',
      role: 'ORG_OWNER' as const,
      status: 'ACTIVE' as const,
      joinedAt: new Date(Date.now() - 365 * 86400000).toISOString(),
      email: 'owner@kolab-agency.example',
      displayName: 'Alex Morgan',
    },
    {
      organizationId,
      userId: 'user_manager_001',
      role: 'AGENCY_MANAGER' as const,
      status: 'ACTIVE' as const,
      joinedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
      email: 'manager@kolab-agency.example',
      displayName: 'Jordan Lee',
    },
    {
      organizationId,
      userId: 'user_recruiter_001',
      role: 'RECRUITER' as const,
      status: 'ACTIVE' as const,
      joinedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      email: 'recruiter@kolab-agency.example',
      displayName: 'Riley Nguyen',
    },
    {
      organizationId,
      userId: 'user_finance_001',
      role: 'FINANCE' as const,
      status: 'ACTIVE' as const,
      joinedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      email: 'finance@kolab-agency.example',
      displayName: 'Casey Brooks',
    },
    {
      organizationId,
      userId: 'user_support_001',
      role: 'SUPPORT' as const,
      status: 'SUSPENDED' as const,
      joinedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      email: 'support@kolab-agency.example',
      displayName: 'Taylor Reed',
    },
  ];

  const invitations = [
    {
      id: 'invite_mock_001',
      organizationId,
      email: 'new.manager@kolab-agency.example',
      role: 'AGENCY_MANAGER' as const,
      status: 'PENDING' as const,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      acceptedAt: null,
      invitedBy: 'user_owner_001',
    },
  ];

  const auditLogs = [
    {
      id: 'audit_mock_001',
      organizationId,
      actorUserId: 'user_owner_001',
      action: 'member.invited',
      targetType: 'invitation',
      targetId: 'invite_mock_001',
      metadata: {},
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'audit_mock_002',
      organizationId,
      actorUserId: 'user_manager_001',
      action: 'member.role_updated',
      targetType: 'member',
      targetId: 'user_recruiter_001',
      metadata: {},
      createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    },
    {
      id: 'audit_mock_003',
      organizationId,
      actorUserId: null,
      action: 'session.revoked',
      targetType: 'session',
      targetId: 'session_mock_001',
      metadata: {},
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
    {
      id: 'audit_mock_004',
      organizationId,
      actorUserId: 'user_owner_001',
      action: 'org.settings_updated',
      targetType: 'organization',
      targetId: organizationId,
      metadata: {},
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    },
  ];

  return buildAdministrationWorkspace({
    organizationId,
    organization: {
      id: organizationId,
      name: 'Kolab Talent Agency',
      slug: 'kolab-talent',
      type: 'AGENCY',
      status: 'ACTIVE',
      settings: { region: 'US-West' },
      createdAt: new Date(Date.now() - 400 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    agencyProfile: {
      description: 'Full-service creator management agency',
      logoUrl: null,
      website: 'https://kolab-agency.example',
      primaryContact: 'Alex Morgan',
      phone: '+1 (555) 010-2000',
      country: 'US',
      timezone: 'America/Los_Angeles',
      supportedLanguages: ['en', 'es'],
      socialLinks: {},
      businessSettings: {
        defaultCurrency: 'USD',
        defaultLocale: 'en',
      },
    },
    agencySettings: {
      onboarding: { enabled: true, requireCreatorApproval: true },
      recruiting: { autoAssignRecruiter: true, defaultRecruiterRole: 'RECRUITER' },
      campaigns: { enabled: true },
      livestream: { enabled: true },
      analytics: { enabled: true },
      messaging: { enabled: false },
    },
    members,
    invitations,
    auditLogs,
    partial: false,
    apiReachable: true,
    useMockIntegrations: true,
  });
}
