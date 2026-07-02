import type { OrganizationRole } from '@kolab/types';

export const LEAD_MANAGER_ROLES = new Set<OrganizationRole>([
  'ORG_OWNER',
  'ORG_ADMIN',
  'AGENCY_MANAGER',
]);

export const DISALLOWED_LEAD_ASSIGNEE_ROLES = new Set<OrganizationRole>(['CREATOR', 'VIEWER']);
