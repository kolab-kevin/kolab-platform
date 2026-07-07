import { Button } from '@kolab/ui';

import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerExportCenter } from '@/types/reporting-workspace';

type ExportCenterPanelProps = {
  exportCenter: ManagerExportCenter;
};

export function ExportCenterPanel({ exportCenter }: ExportCenterPanelProps) {
  return (
    <WorkspaceCard title="Export center" description="Download executive reports (UI only)">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {exportCenter.options.map((option) => (
          <div key={option.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="text-sm font-semibold">{option.label}</div>
            <p className="text-muted-foreground mt-1 text-xs">{option.description}</p>
            <Button variant="outline" size="sm" className="mt-3" type="button" disabled>
              Export
            </Button>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
