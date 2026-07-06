import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerRecruiterPerformance } from '@/types/recruiting-workspace';

type RecruiterPerformancePanelProps = {
  recruiterPerformance: ManagerRecruiterPerformance;
};

export function RecruiterPerformancePanel({
  recruiterPerformance,
}: RecruiterPerformancePanelProps) {
  return (
    <WorkspaceCard title="Recruiter performance" description="Team activity and conversion metrics">
      {recruiterPerformance.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recruiter profiles available.</p>
      ) : (
        <div className="space-y-3">
          {recruiterPerformance.items.map((recruiter) => (
            <div
              key={recruiter.recruiterId}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="text-sm font-semibold">{recruiter.recruiterName}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Leads contacted" value={String(recruiter.leadsContacted)} />
                <Metric label="Response rate" value={recruiter.responseRateLabel} />
                <Metric label="Conversion rate" value={recruiter.conversionRateLabel} />
                <Metric label="Signed creators" value={String(recruiter.signedCreators)} />
                <Metric label="Active workload" value={String(recruiter.activeWorkload)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
