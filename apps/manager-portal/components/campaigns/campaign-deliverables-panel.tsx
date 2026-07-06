import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerDeliverablesSummary } from '@/types/campaign-operations';

const SECTIONS: Array<{ key: keyof ManagerDeliverablesSummary; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'overdue', label: 'Overdue' },
];

type CampaignDeliverablesPanelProps = {
  deliverables: ManagerDeliverablesSummary;
};

export function CampaignDeliverablesPanel({ deliverables }: CampaignDeliverablesPanelProps) {
  return (
    <WorkspaceCard title="Deliverables" description="Creator deliverable status across campaigns">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-muted-foreground text-xs">
                {deliverables[section.key].length}
              </span>
            </div>
            {deliverables[section.key].length === 0 ? (
              <p className="text-muted-foreground text-xs">None</p>
            ) : (
              <div className="space-y-2">
                {deliverables[section.key].slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-white/10 px-2 py-2 text-sm"
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {item.campaignTitle}
                      {item.creatorDisplayName ? ` · ${item.creatorDisplayName}` : ''}
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
