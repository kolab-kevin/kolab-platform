import { fetchCampaignBoardList } from './campaign-board-service';

export async function fetchCampaignAnalyticsData() {
  return fetchCampaignBoardList({ limit: 100 });
}
