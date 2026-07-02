import type { OrganizationRole } from '@kolab/types';

export const RECRUITER_PROFILE_MANAGER_ROLES = new Set<OrganizationRole>([
  'ORG_OWNER',
  'ORG_ADMIN',
  'AGENCY_MANAGER',
]);

export const ELIGIBLE_RECRUITER_PROFILE_MEMBER_ROLES = new Set<OrganizationRole>([
  'RECRUITER',
  'AGENCY_MANAGER',
  'ORG_ADMIN',
  'ORG_OWNER',
]);
