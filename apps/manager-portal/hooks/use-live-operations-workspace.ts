'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import {
  fetchLiveOperationsSessionDetail,
  fetchLiveOperationsWorkspace,
} from '@/services/live-operations-service';
import type {
  LiveOperationsDataSource,
  ManagerLiveOperationsWorkspace,
} from '@/types/live-operations';
import { buildAgencyMonitoring } from '@/types/live-operations-adapters';

export function useLiveOperationsWorkspace() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerLiveOperationsWorkspace | null>(null);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<LiveOperationsDataSource | null>(null);
  const [detailSource, setDetailSource] = React.useState<LiveOperationsDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchLiveOperationsWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);
      setSelectedSessionId(
        (current) =>
          current ?? result.data.selectedSessionId ?? result.data.sessions[0]?.id ?? null,
      );
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load live operations');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization.id]);

  const refreshSessionDetail = React.useCallback(
    async (sessionId: string, creatorDisplayName: string) => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const result = await fetchLiveOperationsSessionDetail(sessionId, creatorDisplayName);
        setDetailSource(result.source);

        if (result.data) {
          setWorkspace((current) =>
            current
              ? {
                  ...current,
                  timeline: result.data!.timeline,
                  coachQueue: [
                    ...current.coachQueue.filter((item) => item.sessionId !== sessionId),
                    ...result.data!.coachQueue,
                  ],
                  agencyMonitoring: buildAgencyMonitoring(
                    current.sessions,
                    [
                      ...current.coachQueue.filter((item) => item.sessionId !== sessionId),
                      ...result.data!.coachQueue,
                    ],
                    result.data!.timeline,
                  ),
                  selectedSessionId: sessionId,
                }
              : current,
          );
        }
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'Unable to load session detail');
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  const selectSession = React.useCallback(
    (sessionId: string) => {
      setSelectedSessionId(sessionId);
      const session = workspace?.sessions.find((item) => item.id === sessionId);
      if (session) {
        void refreshSessionDetail(sessionId, session.creatorDisplayName);
      }
    },
    [refreshSessionDetail, workspace?.sessions],
  );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!selectedSessionId || !workspace) return;
    const session = workspace.sessions.find((item) => item.id === selectedSessionId);
    if (session && workspace.selectedSessionId !== selectedSessionId) {
      void refreshSessionDetail(selectedSessionId, session.creatorDisplayName);
    }
  }, [refreshSessionDetail, selectedSessionId, workspace]);

  const selectedSession =
    workspace?.sessions.find((session) => session.id === selectedSessionId) ?? null;

  const sessionCoachQueue =
    workspace?.coachQueue.filter((item) => item.sessionId === selectedSessionId) ??
    workspace?.coachQueue ??
    [];

  return {
    workspace,
    selectedSession,
    selectedSessionId,
    loading,
    detailLoading,
    error,
    detailError,
    source,
    detailSource,
    sessionTimeline: workspace?.timeline ?? [],
    sessionCoachQueue,
    selectSession,
    refresh,
    refreshSessionDetail,
  };
}
