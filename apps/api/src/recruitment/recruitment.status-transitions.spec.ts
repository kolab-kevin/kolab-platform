import type { LeadStatus } from '@kolab/types';

import {
  isAllowedLeadStatusTransition,
  LEAD_STATUS_TRANSITIONS,
} from './recruitment.status-transitions';

describe('lead status transitions', () => {
  it('allows valid transitions from NEW', () => {
    expect(isAllowedLeadStatusTransition('NEW', 'CONTACTED')).toBe(true);
    expect(isAllowedLeadStatusTransition('NEW', 'INTERESTED')).toBe(true);
    expect(isAllowedLeadStatusTransition('NEW', 'REJECTED')).toBe(true);
  });

  it('rejects invalid transitions from NEW', () => {
    expect(isAllowedLeadStatusTransition('NEW', 'SIGNED')).toBe(false);
    expect(isAllowedLeadStatusTransition('NEW', 'NEW')).toBe(false);
  });

  it('allows reactivation from INACTIVE and REJECTED', () => {
    expect(isAllowedLeadStatusTransition('INACTIVE', 'CONTACTED')).toBe(true);
    expect(isAllowedLeadStatusTransition('REJECTED', 'CONTACTED')).toBe(true);
  });

  it('defines transitions for every lead status', () => {
    const statuses = Object.keys(LEAD_STATUS_TRANSITIONS) as LeadStatus[];

    expect(statuses).toHaveLength(9);
  });
});
