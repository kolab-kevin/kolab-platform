import type { CreatorSummary, ListCreatorsResponse } from '@kolab/types';

import type {
  CreatorManagementSortField,
  ManagerCreatorDetail,
  ManagerCreatorListItem,
} from '@/types/creator-management';

export function mapCreatorSummaryToListItem(summary: CreatorSummary): ManagerCreatorListItem {
  return {
    id: summary.id,
    displayName: summary.displayName,
    email: summary.email,
    country: summary.country,
    languages: summary.languages,
    status: summary.status,
    onboardingStatus: '—',
    complianceStatus: '—',
    intelligenceScore: null,
    performanceScore: null,
    performanceBand: null,
    latestActivity: `Updated ${new Date(summary.updatedAt).toLocaleString()}`,
    managerName: null,
    platformBadges:
      summary.platformCount > 0
        ? [`${summary.platformCount} platform${summary.platformCount === 1 ? '' : 's'}`]
        : [],
    updatedAt: summary.updatedAt,
  };
}

export function mapListCreatorsResponse(response: ListCreatorsResponse): ManagerCreatorListItem[] {
  return response.items.map(mapCreatorSummaryToListItem);
}

export function sortCreatorListItems(
  items: ManagerCreatorListItem[],
  field: CreatorManagementSortField,
  direction: 'asc' | 'desc',
): ManagerCreatorListItem[] {
  const sorted = [...items].sort((left, right) => {
    switch (field) {
      case 'displayName':
        return left.displayName.localeCompare(right.displayName);
      case 'status':
        return left.status.localeCompare(right.status);
      case 'performanceScore':
        return (left.performanceScore ?? -1) - (right.performanceScore ?? -1);
      case 'intelligenceScore':
        return (left.intelligenceScore ?? -1) - (right.intelligenceScore ?? -1);
      case 'updatedAt':
        return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      default:
        return 0;
    }
  });

  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function filterCreatorListItems(
  items: ManagerCreatorListItem[],
  search: string,
): ManagerCreatorListItem[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;

  return items.filter((item) => {
    const haystack = [
      item.displayName,
      item.email ?? '',
      item.country ?? '',
      item.managerName ?? '',
      item.platformBadges.join(' '),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function paginateCreatorListItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    totalPages,
  };
}

export function getCreatorDetailLabel(detail: ManagerCreatorDetail | null): string {
  return detail?.profile.displayName ?? 'Select a creator';
}
