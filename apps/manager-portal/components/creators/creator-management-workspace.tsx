'use client';

import { Button } from '@kolab/ui';

import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
import { CreatorDetailPanel } from '@/components/creators/creator-detail-panel';
import { CreatorFiltersPanel } from '@/components/creators/creator-filters-panel';
import { CreatorListPanel } from '@/components/creators/creator-list-panel';
import { useCreatorManagementWorkspace } from '@/hooks/use-creator-management-workspace';

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

  const sourceLabel =
    source === 'mock' || detailSource === 'mock'
      ? 'Mock data'
      : source === 'partial' || detailSource === 'partial'
        ? 'Partial API data'
        : source === 'live' || detailSource === 'live'
          ? 'Live API data'
          : undefined;

  return (
    <WorkspacePage
      title="Creators"
      description={
        workspace
          ? `${totalFilteredCount} creators in portfolio${sourceLabel ? ` · ${sourceLabel}` : ''}`
          : 'Portfolio creator management'
      }
      loading={loading}
      loadingLabel="Loading creator workspace…"
      error={error}
      errorTitle="Unable to load creators"
      onRetry={() => void refresh()}
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No creators are available in this organization yet." />
        ) : null
      }
    >
      {workspace ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="mb-3 text-base font-semibold">Filters</h2>
            <CreatorFiltersPanel filters={filters} onChange={setFilters} />
          </section>

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
    </WorkspacePage>
  );
}
