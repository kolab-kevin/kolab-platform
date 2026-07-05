export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000'
  );
}

/** Shared mock toggle for dashboard, goals, and performance studio data. */
export function useMockDashboard(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DASHBOARD !== 'false';
}

export function useMockStudioData(): boolean {
  return useMockDashboard();
}

export function getCreatorProfileId(): string {
  return process.env.NEXT_PUBLIC_CREATOR_PROFILE_ID ?? 'creator_mock_001';
}
