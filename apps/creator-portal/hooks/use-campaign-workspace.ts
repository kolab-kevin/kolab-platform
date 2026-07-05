'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import {
  type CampaignWorkspaceDataSource,
  fetchCampaignWorkspace,
} from '@/services/campaign-workspace-loader';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import type { CampaignWorkspaceData, CampaignWorkspaceView } from '@/types/campaign-adapters';

type CampaignWorkspaceState = {
  data: CampaignWorkspaceData;
  loading: boolean;
  error: string | null;
  source: CampaignWorkspaceDataSource | null;
  view: CampaignWorkspaceView;
  selectedCampaignId: string | null;
  setView: (view: CampaignWorkspaceView) => void;
  selectCampaign: (campaignId: string | null) => void;
  refresh: () => Promise<void>;
};

const EMPTY_DATA: CampaignWorkspaceData = {
  assignedCampaigns: [],
  deliverables: {
    pending: [],
    submitted: [],
    approved: [],
    rejected: [],
    overdue: [],
  },
  applications: {
    draft: [],
    applied: [],
    accepted: [],
    rejected: [],
  },
  campaignsById: {},
  templateDeliverablesByCampaignId: {},
};

export function useCampaignWorkspace(): CampaignWorkspaceState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<CampaignWorkspaceData>(EMPTY_DATA);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<CampaignWorkspaceDataSource | null>(null);
  const [view, setView] = React.useState<CampaignWorkspaceView>('list');
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCampaignWorkspace(creatorProfile.id);
      setData(result.data);
      setSource(result.source);

      setSelectedCampaignId((current) =>
        current && result.data.assignedCampaigns.some((item) => item.campaignId === current)
          ? current
          : null,
      );
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load campaign workspace');
      setData(EMPTY_DATA);
      setSource(null);
      setSelectedCampaignId(null);
    } finally {
      setLoading(false);
    }
  }, [creatorProfile.id, router]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    source,
    view,
    selectedCampaignId,
    setView,
    selectCampaign: setSelectedCampaignId,
    refresh,
  };
}
