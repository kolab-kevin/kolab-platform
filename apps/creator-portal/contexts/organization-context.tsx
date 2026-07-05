'use client';

import * as React from 'react';

import { getCreatorProfileId } from '@/lib/env';
import type { CreatorProfileSummary, OrganizationOption } from '@/types/studio-context';

type OrganizationContextValue = {
  organizations: OrganizationOption[];
  activeOrganization: OrganizationOption;
  setActiveOrganizationId: (organizationId: string) => void;
  creatorProfile: CreatorProfileSummary;
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
  const [activeOrganizationId, setActiveOrganizationId] = React.useState(
    PLACEHOLDER_ORGANIZATIONS[0]?.id ?? 'org_mock_001',
  );

  const activeOrganization =
    PLACEHOLDER_ORGANIZATIONS.find((org) => org.id === activeOrganizationId) ??
    PLACEHOLDER_ORGANIZATIONS[0]!;

  const creatorProfile: CreatorProfileSummary = {
    id: getCreatorProfileId(),
    displayName: userEmail?.split('@')[0] ?? 'Creator',
    email: userEmail ?? 'creator@example.com',
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations: PLACEHOLDER_ORGANIZATIONS,
        activeOrganization,
        setActiveOrganizationId,
        creatorProfile,
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
