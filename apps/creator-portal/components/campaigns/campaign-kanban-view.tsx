import { AssignedCampaignCard } from '@/components/campaigns/assigned-campaign-card';
import type { AssignedCampaignDisplayModel } from '@/types/campaign-adapters';

const KANBAN_COLUMNS: Array<{
  key: AssignedCampaignDisplayModel['assignmentStatus'];
  label: string;
}> = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

type CampaignKanbanViewProps = {
  campaigns: AssignedCampaignDisplayModel[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
};

export function CampaignKanbanView({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
}: CampaignKanbanViewProps) {
  if (campaigns.length === 0) {
    return (
      <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
        No assigned campaigns to display in kanban view.
      </p>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((column) => {
        const items = campaigns.filter((campaign) => campaign.assignmentStatus === column.key);

        return (
          <div key={column.key} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-muted-foreground text-xs">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-xs">None</p>
            ) : (
              <ul className="space-y-3">
                {items.map((campaign) => (
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
          </div>
        );
      })}
    </div>
  );
}
