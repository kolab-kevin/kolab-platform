export type WorkspaceSourceLabel =
  'mock' | 'live' | 'empty' | 'partial' | string | null | undefined;

const SOURCE_LABELS: Record<string, string> = {
  mock: 'Mock data',
  live: 'Live API',
  empty: 'No data yet',
  partial: 'Partial API data',
};

export function formatWorkspaceSourceLabel(source: WorkspaceSourceLabel): string {
  if (!source) return '';
  return SOURCE_LABELS[source] ?? String(source);
}

export function appendSourceToDescription(
  description: string,
  source: WorkspaceSourceLabel,
): string {
  const label = formatWorkspaceSourceLabel(source);
  if (!label) return description;
  return `${description} · ${label}`;
}
