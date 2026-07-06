'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import {
  fetchCampaignOperationsDetail,
  fetchCampaignOperationsWorkspace,
} from '@/services/campaign-operations-service';
import type {
  CampaignOperationsDataSource,
  ManagerCampaignOperationsWorkspace,
} from '@/types/campaign-operations';

export function useCampaignOperations() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerCampaignOperationsWorkspace | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<CampaignOperationsDataSource | null>(null);
  const [detailSource, setDetailSource] = React.useState<CampaignOperationsDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCampaignOperationsWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);
      setSelectedCampaignId(
        (current) =>
          current ?? result.data.selectedCampaignId ?? result.data.campaigns[0]?.id ?? null,
      );
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load campaign operations');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization.id]);

  const refreshCampaignDetail = React.useCallback(async (campaignId: string) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const result = await fetchCampaignOperationsDetail(campaignId);
      setDetailSource(result.source);

      if (result.data.detail) {
        setWorkspace((current) =>
          current
            ? {
                ...current,
                detail: result.data.detail,
                deliverables: result.data.deliverables,
                applications: result.data.applications,
                selectedCampaignId: campaignId,
              }
            : current,
        );
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Unable to load campaign detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectCampaign = React.useCallback(
    (campaignId: string) => {
      setSelectedCampaignId(campaignId);
      void refreshCampaignDetail(campaignId);
    },
    [refreshCampaignDetail],
  );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedCampaign =
    workspace?.campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  return {
    workspace,
    selectedCampaign,
    selectedCampaignId,
    loading,
    detailLoading,
    error,
    detailError,
    source,
    detailSource,
    selectCampaign,
    refresh,
    refreshCampaignDetail,
  };
}
