'use client';

import { Button } from '@kolab/ui';

import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { CreatorDetailPanel } from '@/components/creators/creator-detail-panel';
import { CreatorFiltersPanel } from '@/components/creators/creator-filters-panel';
import { CreatorListPanel } from '@/components/creators/creator-list-panel';
import { useCreatorManagementWorkspace } from '@/hooks/use-creator-management-workspace';
import { combineWorkspaceDataSources } from '@/lib/data-source';

export function CreatorManagementWorkspace() {
  const {
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
    totalPages,
    visibleItems,
    totalFilteredCount,
    filters,
    setFilters,
    selectedCreatorId,
    selectCreator,
    refresh,
    refreshDetail,
  } = useCreatorManagementWorkspace();

  const combinedSource = combineWorkspaceDataSources([source, detailSource]);

  return (
    <WorkspaceDataPage
      title="Creators"
      fallbackDescription="Portfolio creator management"
      loadedDescription={workspace ? `${totalFilteredCount} creators in portfolio` : undefined}
      loading={loading}
      loadingLabel="Loading creator workspace…"
      error={error}
      errorTitle="Unable to load creators"
      source={combinedSource}
      emptyMessage="No creators are available in this organization yet."
      onRefresh={refresh}
    >
      {workspace ? (
        <div className="space-y-4">
          <WorkspaceSection title="Filters">
            <CreatorFiltersPanel filters={filters} onChange={setFilters} />
          </WorkspaceSection>

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-7">
              <CreatorListPanel
                items={visibleItems}
                selectedCreatorId={selectedCreatorId}
                search={search}
                sortField={sortField}
                sortDirection={sortDirection}
                page={page}
                totalPages={totalPages}
                totalFilteredCount={totalFilteredCount}
                onSearchChange={setSearch}
                onSortFieldChange={setSortField}
                onSortDirectionChange={setSortDirection}
                onPageChange={setPage}
                onSelectCreator={selectCreator}
              />
            </div>
            <div className="xl:col-span-5">
              <CreatorDetailPanel detail={detail} loading={detailLoading} error={detailError} />
              {detail ? (
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => void refreshDetail?.()}>
                    Refresh detail
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
