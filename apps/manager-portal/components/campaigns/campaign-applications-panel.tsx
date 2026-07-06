import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge';
import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerApplicationsSummary } from '@/types/campaign-operations';

const SECTIONS: Array<{ key: keyof ManagerApplicationsSummary; label: string }> = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

type CampaignApplicationsPanelProps = {
  applications: ManagerApplicationsSummary;
};

export function CampaignApplicationsPanel({ applications }: CampaignApplicationsPanelProps) {
  return (
    <WorkspaceCard title="Applications" description="Creator applications across the portfolio">
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-muted-foreground text-xs">
                {applications[section.key].length}
              </span>
            </div>
            {applications[section.key].length === 0 ? (
              <p className="text-muted-foreground text-xs">None</p>
            ) : (
              <div className="space-y-2">
                {applications[section.key].slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-white/10 px-2 py-2 text-sm"
                  >
                    <div className="font-medium">{item.creatorDisplayName}</div>
                    <div className="text-muted-foreground mt-1 text-xs">{item.campaignTitle}</div>
                    <div className="mt-2">
                      <CampaignStatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
