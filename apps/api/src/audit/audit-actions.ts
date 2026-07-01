export const AUDIT_ACTION = {
  INVITATION_CREATED: 'invitation.created',
  INVITATION_ACCEPTED: 'invitation.accepted',
  INVITATION_REVOKED: 'invitation.revoked',
  MEMBERSHIP_UPDATED: 'membership.updated',
  SESSION_REVOKED: 'session.revoked',
  SESSIONS_REVOKED_OTHERS: 'sessions.revoked_others',
} as const;

export const AUDIT_TARGET_TYPE = {
  INVITATION: 'invitation',
  MEMBERSHIP: 'membership',
  SESSION: 'session',
} as const;
