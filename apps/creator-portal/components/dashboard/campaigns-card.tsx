import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardUpcomingCampaigns } from '@/types/dashboard';

type CampaignsCardProps = {
  campaigns: DashboardUpcomingCampaigns;
};

export function CampaignsCard({ campaigns }: CampaignsCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          <span>{campaigns.assignedCampaigns.length} assigned</span>
          <span>{campaigns.pendingApplications.length} pending applications</span>
        </div>
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
