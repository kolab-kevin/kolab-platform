import { ListInvitationsResponseSchema, ListOrganizationMembersResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { AdministrationApiError } from './administration-errors';
import { apiClient, isApiClientError } from './api-client';

export type UserManagementDataSource = 'mock' | 'live' | 'empty';

export async function fetchOrganizationMembers(): Promise<{
  members: ReturnType<typeof ListOrganizationMembersResponseSchema.parse>['members'];
  source: UserManagementDataSource;
}> {
  if (useMockStudioData()) {
    return { members: [], source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>('/api/organizations/members');
    const parsed = ListOrganizationMembersResponseSchema.parse(data);
    return {
      members: parsed.members,
      source: parsed.members.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new AdministrationApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { members: [], source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load organization members');
  }
}

export async function fetchInvitations(): Promise<{
  invitations: ReturnType<typeof ListInvitationsResponseSchema.parse>['invitations'];
  source: UserManagementDataSource;
}> {
  if (useMockStudioData()) {
    return { invitations: [], source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>('/api/invitations');
    const parsed = ListInvitationsResponseSchema.parse(data);
    return {
      invitations: parsed.invitations,
      source: parsed.invitations.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new AdministrationApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { invitations: [], source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load invitations');
  }
}
