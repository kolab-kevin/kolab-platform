export function useMockDashboard(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DASHBOARD !== 'false';
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

export function getDefaultOrganizationId(): string {
  return process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? 'org_mock_001';
}
