import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import {
  PORTAL_CARD_CLASS,
  PORTAL_CARD_HEADER_CLASS,
  PORTAL_CARD_TITLE_CLASS,
} from '@/lib/portal-ui';
import type { ManagerDashboardResponse } from '@/types/manager-dashboard';

type MetricProps = {
  label: string;
  value: string | number;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function AgencyOverviewCard({
  overview,
}: {
  overview: ManagerDashboardResponse['agencyOverview'];
}) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Agency overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active creators" value={overview.activeCreators} />
        <Metric label="Total roster" value={overview.totalCreators} />
        <Metric label="Live sessions today" value={overview.liveSessionsToday} />
        <Metric label="Open campaigns" value={overview.openCampaigns} />
      </CardContent>
    </Card>
  );
}

export function CreatorHealthCard({
  health,
}: {
  health: ManagerDashboardResponse['creatorHealth'];
}) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Creator health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="At risk" value={health.atRiskCount} />
          <Metric label="Improving" value={health.improvingCount} />
          <Metric label="Avg performance" value={health.averagePerformanceScore} />
        </div>
        <ul className="text-muted-foreground space-y-1 text-sm">
          {health.highlights.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function LiveOperationsCard({ live }: { live: ManagerDashboardResponse['liveOperations'] }) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Live operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Live now" value={live.liveNow} />
          <Metric label="Scheduled today" value={live.scheduledToday} />
          <Metric label="Open alerts" value={live.alertsOpen} />
        </div>
        <ul className="space-y-2 text-sm">
          {live.recentSessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2"
            >
              <span>{session.title}</span>
              <span className="text-muted-foreground text-xs">{session.status}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function CampaignHealthCard({
  campaigns,
}: {
  campaigns: ManagerDashboardResponse['campaignHealth'];
}) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Campaign health</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Metric label="Active campaigns" value={campaigns.activeCampaigns} />
        <Metric label="Overdue deliverables" value={campaigns.overdueDeliverables} />
        <Metric label="Pending applications" value={campaigns.pendingApplications} />
        <Metric label="At-risk assignments" value={campaigns.atRiskAssignments} />
      </CardContent>
    </Card>
  );
}

export function RecruitingPipelineCard({
  recruiting,
}: {
  recruiting: ManagerDashboardResponse['recruitingPipeline'];
}) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Recruiting pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="New leads" value={recruiting.newLeads} />
          <Metric label="In review" value={recruiting.inReview} />
          <Metric label="Converted this month" value={recruiting.convertedThisMonth} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {recruiting.stages.map((stage) => (
            <div
              key={stage.label}
              className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm"
            >
              <span>{stage.label}</span>
              <span className="font-semibold">{stage.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksAlertsCard({ tasks }: { tasks: ManagerDashboardResponse['tasksAndAlerts'] }) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Tasks and alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Open tasks" value={tasks.openTasks} />
          <Metric label="Urgent alerts" value={tasks.urgentAlerts} />
        </div>
        <ul className="space-y-2 text-sm">
          {tasks.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2"
            >
              <span>{item.title}</span>
              <span className="text-muted-foreground text-xs">{item.priority}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RevenuePlaceholderCard({
  revenue,
}: {
  revenue: ManagerDashboardResponse['revenue'];
}) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">MTD (placeholder)</p>
        <p className="mt-1 text-2xl font-semibold">{revenue.mtdRevenue}</p>
        <p className="text-muted-foreground mt-3 text-sm">{revenue.note}</p>
      </CardContent>
    </Card>
  );
}

export function ComplianceBlockersCard({
  compliance,
}: {
  compliance: ManagerDashboardResponse['complianceBlockers'];
}) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>Compliance blockers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Blocked creators" value={compliance.blockedCreators} />
          <Metric label="Expiring documents" value={compliance.expiringDocuments} />
        </div>
        <ul className="space-y-2 text-sm">
          {compliance.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2"
            >
              <span>{item.label}</span>
              <span
                className={
                  item.severity === 'critical'
                    ? 'text-destructive text-xs'
                    : 'text-xs text-amber-400'
                }
              >
                {item.severity}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
