import type { Campaign, LeadSummary } from '@kolab/types';

import type { ManagerTaskItem } from '@/types/operations-center';
import {
  mapCampaignReviewTask,
  mapRecruitingFollowUpTask,
} from '@/types/operations-center-adapters';

function isOverdueFollowUp(nextFollowUpAt: string | null, now = new Date()): boolean {
  if (!nextFollowUpAt) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(nextFollowUpAt).getTime() < startOfToday.getTime();
}

export function buildManagerTasks(input: {
  leads: LeadSummary[];
  campaigns: Campaign[];
}): ManagerTaskItem[] {
  const tasks: ManagerTaskItem[] = [];

  for (const lead of input.leads) {
    if (!lead.nextFollowUpAt) continue;
    tasks.push(mapRecruitingFollowUpTask(lead, isOverdueFollowUp(lead.nextFollowUpAt)));
  }

  for (const campaign of input.campaigns) {
    if (campaign.status === 'DRAFT' || campaign.status === 'ACTIVE') {
      tasks.push(mapCampaignReviewTask(campaign));
    }
  }

  return tasks;
}
