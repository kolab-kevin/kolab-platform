import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge';
import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerCampaignDetail } from '@/types/campaign-operations';

type CampaignDetailPanelProps = {
  detail: ManagerCampaignDetail | null;
  loading?: boolean;
  error?: string | null;
};

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? '—'}</span>
    </div>
  );
}

export function CampaignDetailPanel({ detail, loading, error }: CampaignDetailPanelProps) {
  return (
    <WorkspaceCard title="Campaign detail" description="Selected campaign profile and assignments">
      {loading ? <p className="text-muted-foreground text-sm">Loading campaign detail…</p> : null}
      {!loading && error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!loading && !error && !detail ? (
        <p className="text-muted-foreground text-sm">Select a campaign to view details.</p>
      ) : null}
      {!loading && !error && detail ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{detail.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{detail.description ?? '—'}</p>
          </div>

          <DetailRow label="Brand" value={detail.brandName} />
          <DetailRow label="Budget" value={detail.budgetLabel} />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Timeline</h4>
            {detail.timeline.map((entry) => (
              <DetailRow key={entry.label} label={entry.label} value={entry.value} />
            ))}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Deliverables</h4>
            {detail.deliverableTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No deliverable templates.</p>
            ) : (
              detail.deliverableTemplates.map((item) => (
                <DetailRow
                  key={item.id}
                  label={item.title}
                  value={`${item.status}${item.dueAt ? ` · due ${new Date(item.dueAt).toLocaleDateString()}` : ''}`}
                />
              ))
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Assigned creators</h4>
            {detail.assignedCreators.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assigned creators.</p>
            ) : (
              detail.assignedCreators.map((creator) => (
                <div
                  key={creator.assignmentId}
                  className="flex items-center justify-between gap-2 border-b border-white/5 py-2 text-sm last:border-0"
                >
                  <span>{creator.creatorDisplayName}</span>
                  <CampaignStatusBadge status={creator.status} />
                </div>
              ))
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Status history</h4>
            {detail.statusHistory.map((entry) => (
              <div key={entry.id} className="border-b border-white/5 py-2 text-sm last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <CampaignStatusBadge status={entry.status} />
                  <span className="text-muted-foreground text-xs">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </span>
                </div>
                {entry.note ? (
                  <p className="text-muted-foreground mt-1 text-xs">{entry.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </WorkspaceCard>
  );
}
