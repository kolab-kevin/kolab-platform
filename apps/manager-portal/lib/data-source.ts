import type { WorkspaceDataSource } from '@/types/data-source';

export function formatWorkspaceDataSourceLabel(
  source: WorkspaceDataSource | null | undefined,
): string | undefined {
  if (source === 'mock') return 'Mock data';
  if (source === 'partial') return 'Partial API data';
  if (source === 'live') return 'Live API data';
  return undefined;
}

export function combineWorkspaceDataSources(
  sources: Array<WorkspaceDataSource | null | undefined>,
): WorkspaceDataSource | null {
  const active = sources.filter((source): source is WorkspaceDataSource => source != null);
  if (active.length === 0) return null;
  if (active.includes('mock')) return 'mock';
  if (active.includes('partial')) return 'partial';
  if (active.includes('live')) return 'live';
  return 'empty';
}

export function appendDataSourceSuffix(
  description: string,
  source: WorkspaceDataSource | null | undefined,
): string {
  const label = formatWorkspaceDataSourceLabel(source);
  return label ? `${description} · ${label}` : description;
}
