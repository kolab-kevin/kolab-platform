export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

export function useMockDashboard(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DASHBOARD !== 'false';
}

export function getCreatorProfileId(): string {
  return process.env.NEXT_PUBLIC_CREATOR_PROFILE_ID ?? 'creator_mock_001';
}
