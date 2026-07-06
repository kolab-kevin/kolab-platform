import { groupFollowUpQueue } from '@/types/recruiting-adapters';
import type { ManagerFollowUpQueue, ManagerProspectListItem } from '@/types/recruiting-workspace';

export function buildFollowUpQueue(prospects: ManagerProspectListItem[]): ManagerFollowUpQueue {
  return groupFollowUpQueue(prospects);
}
