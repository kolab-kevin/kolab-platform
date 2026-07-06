import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge';
import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerCampaignBoard } from '@/types/campaign-operations';

const COLUMNS: Array<{ key: keyof ManagerCampaignBoard; label: string }> = [
  { key: 'draft', label: 'Draft' },
  { key: 'recruiting', label: 'Recruiting' },
  { key: 'active', label: 'Active' },
  { key: 'review', label: 'Review' },
  { key: 'completed', label: 'Completed' },
];

type CampaignBoardPanelProps = {
  board: ManagerCampaignBoard;
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
};

export function CampaignBoardPanel({
  board,
  selectedCampaignId,
  onSelectCampaign,
}: CampaignBoardPanelProps) {
  return (
    <WorkspaceCard title="Campaign board" description="Pipeline by operational stage">
      <div className="grid gap-3 xl:grid-cols-5">
        {COLUMNS.map((column) => (
          <div key={column.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-muted-foreground text-xs">{board[column.key].length}</span>
            </div>
            <div className="space-y-2">
              {board[column.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No campaigns</p>
              ) : (
                board[column.key].map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => onSelectCampaign(campaign.id)}
                    className={
                      campaign.id === selectedCampaignId
                        ? 'w-full rounded-md border border-white/20 bg-white/[0.06] p-2 text-left'
                        : 'w-full rounded-md border border-white/10 bg-white/[0.02] p-2 text-left hover:bg-white/[0.04]'
                    }
                  >
                    <div className="text-sm font-medium">{campaign.title}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {campaign.brandName ?? '—'}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <CampaignStatusBadge status={campaign.status} />
                      <span className="text-muted-foreground text-xs">
                        {campaign.budgetLabel ?? '—'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
