const canUseStorage = () => typeof window !== 'undefined';

export function readPortalStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writePortalStorage<T>(key: string, value: T): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or privacy mode failures.
  }
}

export const PORTAL_STORAGE_KEYS = {
  preferences: 'kolab.manager-portal.preferences',
  activeOrganizationId: 'kolab.manager-portal.active-organization-id',
} as const;
