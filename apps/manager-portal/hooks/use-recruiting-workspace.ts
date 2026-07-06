'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import {
  fetchRecruitingProspectDetail,
  fetchRecruitingWorkspace,
} from '@/services/recruiting-operations-service';
import type {
  ManagerRecruitingWorkspace,
  RecruitingDataSource,
} from '@/types/recruiting-workspace';

export function useRecruitingWorkspace() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerRecruitingWorkspace | null>(null);
  const [selectedProspectId, setSelectedProspectId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<RecruitingDataSource | null>(null);
  const [detailSource, setDetailSource] = React.useState<RecruitingDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchRecruitingWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);
      setSelectedProspectId(
        (current) =>
          current ?? result.data.selectedProspectId ?? result.data.prospects[0]?.id ?? null,
      );
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load recruiting workspace');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization.id]);

  const refreshProspectDetail = React.useCallback(async (prospectId: string) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const result = await fetchRecruitingProspectDetail(prospectId);
      setDetailSource(result.source);

      if (result.data) {
        setWorkspace((current) =>
          current
            ? {
                ...current,
                detail: result.data,
                selectedProspectId: prospectId,
              }
            : current,
        );
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Unable to load prospect detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectProspect = React.useCallback(
    (prospectId: string) => {
      setSelectedProspectId(prospectId);
      void refreshProspectDetail(prospectId);
    },
    [refreshProspectDetail],
  );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedProspect =
    workspace?.prospects.find((prospect) => prospect.id === selectedProspectId) ?? null;

  return {
    workspace,
    selectedProspect,
    selectedProspectId,
    loading,
    detailLoading,
    error,
    detailError,
    source,
    detailSource,
    selectProspect,
    refresh,
    refreshProspectDetail,
  };
}
