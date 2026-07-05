import { AssignedCampaignCard } from '@/components/campaigns/assigned-campaign-card';
import type { AssignedCampaignDisplayModel } from '@/types/campaign-adapters';

type AssignedCampaignsSectionProps = {
  campaigns: AssignedCampaignDisplayModel[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
};

export function AssignedCampaignsSection({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
}: AssignedCampaignsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Assigned Campaigns</h2>
        <span className="text-muted-foreground text-xs">{campaigns.length} campaigns</span>
      </div>
      {campaigns.length === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
          No assigned campaigns right now.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <li key={campaign.assignmentId}>
              <AssignedCampaignCard
                model={campaign}
                selected={selectedCampaignId === campaign.campaignId}
                onSelect={() => onSelectCampaign(campaign.campaignId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
