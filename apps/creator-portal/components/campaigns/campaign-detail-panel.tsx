import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import {
  type CampaignWorkspaceData,
  extractCampaignDetailSections,
  toCampaignDetailDisplayModel,
} from '@/types/campaign-adapters';

type CampaignDetailPanelProps = {
  campaignId: string | null;
  data: CampaignWorkspaceData;
  onClose: () => void;
};

function DetailSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Array<{ label: string; value: string }> | string[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : typeof items[0] === 'string' ? (
        <ul className="space-y-1 text-sm">
          {(items as string[]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <dl className="space-y-2 text-sm">
          {(items as Array<{ label: string; value: string }>).map((item) => (
            <div key={`${item.label}-${item.value}`}>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                {item.label}
              </dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function CampaignDetailPanel({ campaignId, data, onClose }: CampaignDetailPanelProps) {
  if (!campaignId) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select an assigned campaign to view read-only details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const campaign = data.campaignsById[campaignId];
  if (!campaign) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Campaign details are not available.</p>
        </CardContent>
      </Card>
    );
  }

  const assignment = data.assignedCampaigns.find((item) => item.campaignId === campaignId) ?? null;
  const creatorDeliverables = Object.values(data.deliverables)
    .flat()
    .filter((item) => item.campaignId === campaignId);
  const detail = toCampaignDetailDisplayModel({
    campaign,
    templateDeliverables: data.templateDeliverablesByCampaignId[campaignId] ?? [],
    creatorDeliverables,
    assignment: assignment
      ? {
          id: assignment.assignmentId,
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          creatorProfileId: '',
          applicationId: null,
          status: assignment.assignmentStatus,
          assignedByUserId: '',
          assignedAt: campaign.createdAt,
          acceptedAt: null,
          completedAt: null,
          cancelledAt: null,
          metadata: {},
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        }
      : null,
  });
  const sections = extractCampaignDetailSections(detail.campaign);

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{campaign.title}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {campaign.brandName ?? 'Unknown brand'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <DetailSection
          title="Description"
          items={sections.description ? [sections.description] : []}
          emptyMessage="No description provided."
        />
        <DetailSection
          title="Requirements"
          items={sections.requirements}
          emptyMessage="No requirements listed."
        />
        <DetailSection
          title="Brief"
          items={sections.brief}
          emptyMessage="No brief details listed."
        />
        <DetailSection
          title="Deliverables"
          items={detail.templateDeliverables.map((item) => `${item.title} · ${item.status}`)}
          emptyMessage="No campaign deliverables listed."
        />
        <DetailSection
          title="Timeline"
          items={sections.timeline}
          emptyMessage="No timeline listed."
        />
        <DetailSection
          title="Compensation"
          items={sections.compensation ? [sections.compensation] : []}
          emptyMessage="Compensation not specified."
        />
        <DetailSection
          title="Categories"
          items={sections.categories}
          emptyMessage="No categories listed."
        />
        <DetailSection
          title="Platforms"
          items={sections.platforms}
          emptyMessage="No platforms listed."
        />
        <DetailSection
          title="Creator Responsibilities"
          items={sections.creatorResponsibilities}
          emptyMessage="No responsibilities listed."
        />
      </CardContent>
    </Card>
  );
}
