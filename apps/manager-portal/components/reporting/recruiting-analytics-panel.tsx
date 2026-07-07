import { WorkspaceCard } from '@/components/common/workspace-layout';
import { MetricCard } from '@/components/reporting/metric-card';
import type { ManagerRecruitingAnalytics } from '@/types/reporting-workspace';

type RecruitingAnalyticsPanelProps = {
  analytics: ManagerRecruitingAnalytics;
};

export function RecruitingAnalyticsPanel({ analytics }: RecruitingAnalyticsPanelProps) {
  return (
    <WorkspaceCard
      title="Recruiting analytics"
      description="Lead sources and conversion performance"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            label="Conversion funnel"
            value={analytics.conversionFunnelLabel}
            trend="up"
          />
          <MetricCard label="Time to conversion" value={analytics.timeToConversionLabel} />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Lead sources</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {analytics.leadSources.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <div>{item.label}</div>
                <div className="text-lg font-semibold">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Recruiter performance</h4>
          {analytics.recruiterPerformance.map((recruiter) => (
            <div
              key={recruiter.name}
              className="border-b border-white/5 py-2 text-sm last:border-0"
            >
              <div className="font-medium">{recruiter.name}</div>
              <div className="text-muted-foreground text-xs">
                {recruiter.value}
                {recruiter.detail ? ` · ${recruiter.detail}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceCard>
  );
}
