'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import {
  fetchCreatorManagementDetail,
  fetchCreatorManagementWorkspace,
} from '@/services/creator-management-service';
import {
  filterCreatorListItems,
  paginateCreatorListItems,
  sortCreatorListItems,
} from '@/types/creator-adapters';
import {
  type CreatorManagementDataSource,
  type CreatorManagementFilters,
  type CreatorManagementSortField,
  DEFAULT_CREATOR_FILTERS,
  type ManagerCreatorDetail,
  type ManagerCreatorManagementWorkspace,
} from '@/types/creator-management';

const PAGE_SIZE = 8;

export function useCreatorManagementWorkspace() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerCreatorManagementWorkspace | null>(null);
  const [detail, setDetail] = React.useState<ManagerCreatorDetail | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<CreatorManagementDataSource | null>(null);
  const [detailSource, setDetailSource] = React.useState<CreatorManagementDataSource | null>(null);
  const [search, setSearch] = React.useState('');
  const [sortField, setSortField] = React.useState<CreatorManagementSortField>('displayName');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState<CreatorManagementFilters>(DEFAULT_CREATOR_FILTERS);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCreatorManagementWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);

      setSelectedCreatorId((current) => current ?? result.data.list.items[0]?.id ?? null);
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load creators');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization.id]);

  const refreshDetail = React.useCallback(async (creatorId: string) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const result = await fetchCreatorManagementDetail(creatorId);
      setDetail(result.data);
      setDetailSource(result.source);
    } catch (err) {
      setDetail(null);
      setDetailSource(null);
      setDetailError(err instanceof Error ? err.message : 'Unable to load creator detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!selectedCreatorId) {
      setDetail(null);
      return;
    }

    void refreshDetail(selectedCreatorId);
  }, [selectedCreatorId, refreshDetail]);

  const filteredItems = React.useMemo(() => {
    if (!workspace) return [];

    const searched = filterCreatorListItems(workspace.list.items, search);
    const filtered = searched.filter((item) => {
      if (filters.status !== 'ALL' && item.status !== filters.status) return false;
      if (filters.country !== 'ALL' && item.country !== filters.country) return false;
      if (filters.language !== 'ALL' && !item.languages.includes(filters.language)) return false;
      if (filters.platform !== 'ALL' && !item.platformBadges.includes(filters.platform))
        return false;
      if (filters.performanceBand !== 'ALL' && item.performanceBand !== filters.performanceBand) {
        return false;
      }
      if (filters.compliance !== 'ALL' && item.complianceStatus !== filters.compliance) {
        return false;
      }
      return true;
    });

    return sortCreatorListItems(filtered, sortField, sortDirection);
  }, [workspace, search, filters, sortField, sortDirection]);

  const pagination = React.useMemo(
    () => paginateCreatorListItems(filteredItems, page, PAGE_SIZE),
    [filteredItems, page],
  );

  React.useEffect(() => {
    setPage(1);
  }, [search, filters, sortField, sortDirection]);

  return {
    workspace,
    detail,
    loading,
    detailLoading,
    error,
    detailError,
    source,
    detailSource,
    search,
    setSearch,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: pagination.totalPages,
    visibleItems: pagination.items,
    totalFilteredCount: filteredItems.length,
    filters,
    setFilters,
    selectedCreatorId,
    selectCreator: setSelectedCreatorId,
    refresh,
    refreshDetail: () => (selectedCreatorId ? refreshDetail(selectedCreatorId) : undefined),
  };
}
