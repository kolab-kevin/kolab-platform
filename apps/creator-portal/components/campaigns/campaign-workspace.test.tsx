import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ApplicationCard } from '@/components/campaigns/application-card';
import { AssignedCampaignCard } from '@/components/campaigns/assigned-campaign-card';
import { CampaignDetailPanel } from '@/components/campaigns/campaign-detail-panel';
import { CampaignKanbanView } from '@/components/campaigns/campaign-kanban-view';
import { CampaignListView } from '@/components/campaigns/campaign-list-view';
import { DeliverableCard } from '@/components/campaigns/deliverable-card';
import { DeliverablesSection } from '@/components/campaigns/deliverables-section';
import { ApplicationStatusBadge } from '@/components/common/application-status-badge';
import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { DeliverableStatusBadge } from '@/components/common/deliverable-status-badge';
import { createMockCampaignWorkspace } from '@/services/campaign-mock';
import {
  buildCampaignWorkspaceData,
  getApplicationBucket,
  getDeliverableBucket,
  groupApplications,
  groupDeliverables,
  toApplicationDisplayModel,
} from '@/types/campaign-adapters';

describe('campaign adapters', () => {
  const workspace = createMockCampaignWorkspace('creator_test_001');

  it('groups deliverables into display buckets', () => {
    expect(workspace.deliverables.pending.length).toBeGreaterThan(0);
    expect(workspace.deliverables.submitted.length).toBeGreaterThan(0);
    expect(workspace.deliverables.approved.length).toBeGreaterThan(0);
    expect(workspace.deliverables.rejected.length).toBeGreaterThan(0);
    expect(workspace.deliverables.overdue.length).toBeGreaterThan(0);
  });

  it('groups applications into display buckets', () => {
    expect(workspace.applications.draft.length).toBeGreaterThan(0);
    expect(workspace.applications.applied.length).toBeGreaterThan(0);
    expect(workspace.applications.accepted.length).toBeGreaterThan(0);
    expect(workspace.applications.rejected.length).toBeGreaterThan(0);
  });

  it('maps deliverable buckets from API status and due date', () => {
    expect(
      getDeliverableBucket({
        id: 'x',
        organizationId: 'org',
        assignmentId: 'assign_1',
        campaignDeliverableId: 'tmpl',
        status: 'ASSIGNED',
        dueAt: '2000-01-01T00:00:00.000Z',
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        submissionUrl: null,
        notes: null,
        metadata: {},
        createdAt: '2000-01-01T00:00:00.000Z',
        updatedAt: '2000-01-01T00:00:00.000Z',
      }),
    ).toBe('overdue');
  });

  it('handles partial workspace data', () => {
    const partial = buildCampaignWorkspaceData({
      campaigns: [],
      assignments: [],
      applications: [],
      creatorDeliverables: [],
      templateDeliverables: [],
    });

    expect(partial.assignedCampaigns).toHaveLength(0);
    expect(groupDeliverables([])).toEqual(partial.deliverables);
    expect(groupApplications([])).toEqual(partial.applications);
  });
});

describe('campaign workspace rendering', () => {
  const workspace = createMockCampaignWorkspace('creator_test_001');
  const assigned = workspace.assignedCampaigns[0]!;

  it('renders assigned campaign card', () => {
    const html = renderToStaticMarkup(<AssignedCampaignCard model={assigned} />);

    expect(html).toContain('Summer Beauty Launch');
    expect(html).toContain('Glow Labs');
    expect(html).toContain('IN PROGRESS');
  });

  it('renders list view', () => {
    const html = renderToStaticMarkup(
      <CampaignListView
        campaigns={workspace.assignedCampaigns}
        selectedCampaignId={null}
        onSelectCampaign={() => undefined}
      />,
    );

    expect(html).toContain('Assigned Campaigns');
    expect(html).toContain('Summer Beauty Launch');
  });

  it('renders kanban view columns', () => {
    const html = renderToStaticMarkup(
      <CampaignKanbanView
        campaigns={workspace.assignedCampaigns}
        selectedCampaignId={null}
        onSelectCampaign={() => undefined}
      />,
    );

    expect(html).toContain('In Progress');
    expect(html).toContain('Assigned');
  });

  it('renders deliverables section empty state', () => {
    const html = renderToStaticMarkup(
      <DeliverablesSection
        deliverables={{
          pending: [],
          submitted: [],
          approved: [],
          rejected: [],
          overdue: [],
        }}
      />,
    );

    expect(html).toContain('No deliverables to show.');
  });

  it('renders deliverable card with bucket badge', () => {
    const deliverable = workspace.deliverables.submitted[0]!;
    const html = renderToStaticMarkup(<DeliverableCard model={deliverable} />);

    expect(html).toContain('submitted');
  });

  it('renders application card', () => {
    const application = workspace.applications.draft[0]!;
    const html = renderToStaticMarkup(<ApplicationCard model={application} />);

    expect(html).toContain('Back-to-School Tech Drop');
    expect(html).toContain('draft');
  });

  it('renders campaign detail panel placeholder', () => {
    const html = renderToStaticMarkup(
      <CampaignDetailPanel campaignId={null} data={workspace} onClose={() => undefined} />,
    );

    expect(html).toContain('Select an assigned campaign');
  });

  it('renders campaign detail panel for selected campaign', () => {
    const html = renderToStaticMarkup(
      <CampaignDetailPanel campaignId="camp_1" data={workspace} onClose={() => undefined} />,
    );

    expect(html).toContain('Description');
    expect(html).toContain('Compensation');
    expect(html).toContain('Creator Responsibilities');
  });
});

describe('campaign status badges', () => {
  it('renders campaign status badge', () => {
    const html = renderToStaticMarkup(<CampaignStatusBadge status="IN_PROGRESS" />);
    expect(html).toContain('IN PROGRESS');
  });

  it('renders deliverable status badge with bucket', () => {
    const html = renderToStaticMarkup(
      <DeliverableStatusBadge status="ASSIGNED" bucket="overdue" />,
    );
    expect(html).toContain('overdue');
  });

  it('renders application status badge with bucket', () => {
    const html = renderToStaticMarkup(<ApplicationStatusBadge status="INVITED" bucket="draft" />);
    expect(html).toContain('draft');
  });
});

describe('application adapter edge cases', () => {
  it('returns null for unsupported application statuses', () => {
    const model = toApplicationDisplayModel({
      application: {
        id: 'app_1',
        organizationId: 'org',
        campaignId: 'camp_1',
        creatorProfileId: 'creator_1',
        status: 'WITHDRAWN',
        source: 'CREATOR_APPLIED',
        message: null,
        invitedByUserId: null,
        appliedAt: null,
        reviewedByUserId: null,
        reviewedAt: null,
        decisionReason: null,
        metadata: {},
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      campaignTitle: 'Campaign',
      brandName: 'Brand',
      dueAt: null,
    });

    expect(model).toBeNull();
    expect(getApplicationBucket('WITHDRAWN')).toBeNull();
  });
});
