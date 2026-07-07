import type { ManagerHealthStatus, ManagerSystemHealth } from '@/types/administration-workspace';

type SystemHealthInput = {
  apiReachable: boolean;
  partial: boolean;
};

export function buildSystemHealth(input: SystemHealthInput): ManagerSystemHealth {
  const apiStatus: ManagerHealthStatus = input.apiReachable
    ? input.partial
      ? 'degraded'
      : 'healthy'
    : 'unknown';

  return {
    apiStatus,
    apiStatusLabel:
      apiStatus === 'healthy'
        ? 'All administration APIs responding'
        : apiStatus === 'degraded'
          ? 'Some administration APIs returned empty data'
          : 'API status unavailable',
    queueStatus: 'unknown',
    queueStatusLabel: 'Queue monitoring not configured (placeholder)',
    backgroundJobsLabel: 'Background jobs dashboard pending integration',
    storageLabel: 'Document storage connected',
    storageStatus: input.apiReachable ? 'healthy' : 'unknown',
    versionLabel: 'Manager Portal v0.8 · MP-08',
    environmentLabel:
      process.env.NODE_ENV === 'production' ? 'Production' : 'Development / staging',
  };
}
