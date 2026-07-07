'use client';

import * as React from 'react';

import { getDefaultOrganizationId } from '@/lib/env';
import { PORTAL_STORAGE_KEYS, readPortalStorage, writePortalStorage } from '@/lib/portal-storage';
import type { ManagerProfileSummary, OrganizationOption } from '@/types/portal-context';

type OrganizationContextValue = {
  organizations: OrganizationOption[];
  activeOrganization: OrganizationOption;
  setActiveOrganizationId: (organizationId: string) => void;
  managerProfile: ManagerProfileSummary;
};

const PLACEHOLDER_ORGANIZATIONS: OrganizationOption[] = [
  { id: 'org_mock_001', name: 'Kōlab Creator Agency', slug: 'kolab-agency' },
  { id: 'org_mock_002', name: 'Studio Collective', slug: 'studio-collective' },
];

const OrganizationContext = React.createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const [activeOrganizationId, setActiveOrganizationIdState] = React.useState(() =>
    readPortalStorage(PORTAL_STORAGE_KEYS.activeOrganizationId, getDefaultOrganizationId()),
  );

  const setActiveOrganizationId = React.useCallback((organizationId: string) => {
    setActiveOrganizationIdState(organizationId);
    writePortalStorage(PORTAL_STORAGE_KEYS.activeOrganizationId, organizationId);
  }, []);

  const activeOrganization =
    PLACEHOLDER_ORGANIZATIONS.find((org) => org.id === activeOrganizationId) ??
    PLACEHOLDER_ORGANIZATIONS[0]!;

  const managerProfile: ManagerProfileSummary = {
    id: 'manager_mock_001',
    displayName: userEmail?.split('@')[0] ?? 'Manager',
    email: userEmail ?? 'manager@example.com',
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations: PLACEHOLDER_ORGANIZATIONS,
        activeOrganization,
        setActiveOrganizationId,
        managerProfile,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = React.useContext(OrganizationContext);
  if (!ctx) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return ctx;
}
