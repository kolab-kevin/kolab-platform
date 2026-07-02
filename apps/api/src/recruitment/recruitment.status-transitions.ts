import type { LeadStatus } from '@kolab/types';

export const LEAD_STATUS_TRANSITIONS: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  NEW: ['CONTACTED', 'INTERESTED', 'REJECTED'],
  CONTACTED: ['INTERESTED', 'APPLICATION', 'INACTIVE', 'REJECTED'],
  INTERESTED: ['APPLICATION', 'CONTRACT_SENT', 'INACTIVE', 'REJECTED'],
  APPLICATION: ['CONTRACT_SENT', 'REJECTED', 'INACTIVE'],
  CONTRACT_SENT: ['SIGNED', 'REJECTED', 'INACTIVE'],
  SIGNED: ['ACTIVE_CREATOR', 'INACTIVE'],
  ACTIVE_CREATOR: ['INACTIVE'],
  INACTIVE: ['CONTACTED', 'INTERESTED'],
  REJECTED: ['CONTACTED'],
};

export function isAllowedLeadStatusTransition(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_STATUS_TRANSITIONS[from].includes(to);
}
