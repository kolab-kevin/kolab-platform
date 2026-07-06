import { WorkspaceCard } from '@/components/common/workspace-layout';
import { RecruitmentStatusBadge } from '@/components/recruiting/recruitment-status-badge';
import type { ManagerProspectPipeline } from '@/types/recruiting-workspace';

const COLUMNS: Array<{ key: keyof ManagerProspectPipeline; label: string }> = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'interview', label: 'Interview' },
  { key: 'pending', label: 'Pending' },
  { key: 'signed', label: 'Signed' },
  { key: 'declined', label: 'Declined' },
];

type PipelineBoardPanelProps = {
  pipeline: ManagerProspectPipeline;
  selectedProspectId: string | null;
  onSelectProspect: (prospectId: string) => void;
};

export function PipelineBoardPanel({
  pipeline,
  selectedProspectId,
  onSelectProspect,
}: PipelineBoardPanelProps) {
  return (
    <WorkspaceCard title="Prospect pipeline" description="Recruitment stages by lead status">
      <div className="grid gap-3 xl:grid-cols-7">
        {COLUMNS.map((column) => (
          <div key={column.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-muted-foreground text-xs">{pipeline[column.key].length}</span>
            </div>
            <div className="space-y-2">
              {pipeline[column.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No prospects</p>
              ) : (
                pipeline[column.key].map((prospect) => (
                  <button
                    key={prospect.id}
                    type="button"
                    onClick={() => onSelectProspect(prospect.id)}
                    className={
                      prospect.id === selectedProspectId
                        ? 'w-full rounded-md border border-white/20 bg-white/[0.06] p-2 text-left'
                        : 'w-full rounded-md border border-white/10 bg-white/[0.02] p-2 text-left hover:bg-white/[0.04]'
                    }
                  >
                    <div className="text-sm font-medium">{prospect.name}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Score {prospect.score}
                      {prospect.assignedRecruiterName ? ` · ${prospect.assignedRecruiterName}` : ''}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <RecruitmentStatusBadge status={prospect.status} />
                      {prospect.nextFollowUpAt ? (
                        <span className="text-muted-foreground text-xs">
                          {new Date(prospect.nextFollowUpAt).toLocaleDateString()}
                        </span>
                      ) : null}
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
