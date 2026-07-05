import { AssignedCampaignsSection } from '@/components/campaigns/assigned-campaigns-section';
import type { AssignedCampaignDisplayModel } from '@/types/campaign-adapters';

type CampaignListViewProps = {
  campaigns: AssignedCampaignDisplayModel[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
};

export function CampaignListView({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
}: CampaignListViewProps) {
  return (
    <AssignedCampaignsSection
      campaigns={campaigns}
      selectedCampaignId={selectedCampaignId}
      onSelectCampaign={onSelectCampaign}
    />
  );
}
