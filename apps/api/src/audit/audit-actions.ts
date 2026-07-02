export const AUDIT_ACTION = {
  INVITATION_CREATED: 'invitation.created',
  INVITATION_ACCEPTED: 'invitation.accepted',
  INVITATION_REVOKED: 'invitation.revoked',
  MEMBERSHIP_UPDATED: 'membership.updated',
  SESSION_REVOKED: 'session.revoked',
  SESSIONS_REVOKED_OTHERS: 'sessions.revoked_others',
  PROFILE_UPDATED: 'profile.updated',
  ADMIN_USER_UPDATED: 'admin.user.updated',
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_DELETED: 'lead.deleted',
} as const;

export const AUDIT_TARGET_TYPE = {
  INVITATION: 'invitation',
  MEMBERSHIP: 'membership',
  SESSION: 'session',
  PROFILE: 'profile',
  USER: 'user',
  LEAD: 'lead',
} as const;
