import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardDeliverables, DashboardUpcomingCampaigns } from '@/types/dashboard';

type CampaignsCardProps = {
  campaigns: DashboardUpcomingCampaigns;
  deliverables: DashboardDeliverables;
};

export function CampaignsCard({ campaigns, deliverables }: CampaignsCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <span>{campaigns.assignedCampaigns.length} assigned</span>
          <span>{campaigns.pendingApplications.length} pending</span>
          <span>{deliverables.upcoming.length} upcoming deliverables</span>
          <span>{deliverables.overdue.length} overdue</span>
        </div>

        {campaigns.dueDates.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Next due dates
            </p>
            <ul className="space-y-1 text-sm">
              {campaigns.dueDates.slice(0, 3).map((dueDate) => (
                <li
                  key={`${dueDate.campaignId}-${dueDate.dueAt}`}
                  className="flex justify-between gap-2"
                >
                  <span className="truncate">{dueDate.label}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(dueDate.dueAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {campaigns.assignedCampaigns.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active campaign assignments.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.assignedCampaigns.map((campaign) => (
              <li
                key={campaign.assignmentId}
                className="border-border/60 rounded-lg border px-3 py-2 text-sm"
              >
                <p className="font-medium">{campaign.campaignTitle}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {campaign.status}
                  {campaign.dueAt ? ` · due ${new Date(campaign.dueAt).toLocaleDateString()}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
