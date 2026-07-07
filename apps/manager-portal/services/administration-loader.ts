import { getDefaultOrganizationId } from '@/lib/env';

import { fetchAuditLogs } from './audit-center-service';
import { fetchAgencyProfile, fetchCurrentOrganization } from './organization-service';
import { fetchInvitations, fetchOrganizationMembers } from './user-management-service';

export type AdministrationLoaderResult = {
  organization: Awaited<ReturnType<typeof fetchCurrentOrganization>>['data'];
  agencyProfile: Awaited<ReturnType<typeof fetchAgencyProfile>>['profile'];
  agencySettings: Awaited<ReturnType<typeof fetchAgencyProfile>>['settings'];
  members: Awaited<ReturnType<typeof fetchOrganizationMembers>>['members'];
  invitations: Awaited<ReturnType<typeof fetchInvitations>>['invitations'];
  auditLogs: Awaited<ReturnType<typeof fetchAuditLogs>>['items'];
  partial: boolean;
  apiReachable: boolean;
};

export async function loadAdministrationSources(
  organizationId: string = getDefaultOrganizationId(),
): Promise<AdministrationLoaderResult> {
  void organizationId;

  const [organizationResult, agencyResult, membersResult, invitationsResult, auditResult] =
    await Promise.all([
      fetchCurrentOrganization(),
      fetchAgencyProfile(),
      fetchOrganizationMembers(),
      fetchInvitations(),
      fetchAuditLogs(),
    ]);

  const partial =
    organizationResult.source === 'empty' ||
    agencyResult.source === 'empty' ||
    membersResult.source === 'empty' ||
    invitationsResult.source === 'empty' ||
    auditResult.source === 'empty';

  const apiReachable =
    organizationResult.source === 'live' ||
    agencyResult.source === 'live' ||
    membersResult.source === 'live' ||
    invitationsResult.source === 'live' ||
    auditResult.source === 'live';

  return {
    organization: organizationResult.data,
    agencyProfile: agencyResult.profile,
    agencySettings: agencyResult.settings,
    members: membersResult.members,
    invitations: invitationsResult.invitations,
    auditLogs: auditResult.items,
    partial,
    apiReachable,
  };
}
