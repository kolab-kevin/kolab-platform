import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CompliancePanel } from '@/components/profile/compliance-panel';
import { CreatorProfilePanel } from '@/components/profile/creator-profile-panel';
import { PlatformAccountsPanel } from '@/components/profile/platform-accounts-panel';
import { SkillsCategoriesPanel } from '@/components/profile/skills-categories-panel';
import { SettingsGeneralSection } from '@/components/settings/settings-general-section';
import { SettingsNotificationsSection } from '@/components/settings/settings-notifications-section';
import { SettingsSystemSection } from '@/components/settings/settings-system-section';
import {
  createMockCreatorAvailability,
  createMockCreatorCompliance,
  createMockCreatorDetail,
  createMockCreatorSkills,
  createMockPlatformAccounts,
  createMockUserProfile,
} from '@/services/profile-mock';
import {
  buildProfileWorkspaceData,
  buildSettingsWorkspaceData,
  toComplianceDisplayModel,
  toPlatformAccountDisplayModels,
  toProfileDisplayModel,
  toSkillsDisplayModel,
} from '@/types/profile-adapters';

describe('profile adapters', () => {
  const detail = createMockCreatorDetail('creator_test_001');
  const compliance = createMockCreatorCompliance('creator_test_001');
  const workspace = buildProfileWorkspaceData({
    creatorProfileId: 'creator_test_001',
    detail,
    platformAccounts: createMockPlatformAccounts('creator_test_001'),
    skills: createMockCreatorSkills(),
    availability: createMockCreatorAvailability(),
    compliance,
  });

  it('maps creator profile display model with contact permissions', () => {
    const profile = toProfileDisplayModel(detail, compliance);
    expect(profile?.displayName).toBe('Alex Rivera');
    expect(profile?.username).toBe('alexrivera.live');
    expect(profile?.contact.canViewEmail).toBe(true);
    expect(profile?.contact.canViewPhone).toBe(true);
  });

  it('maps platform accounts and skills', () => {
    expect(
      toPlatformAccountDisplayModels(createMockPlatformAccounts('creator_test_001')).length,
    ).toBe(4);
    expect(
      toSkillsDisplayModel(createMockCreatorSkills(), createMockCreatorAvailability())
        ?.preferredCampaignTypes,
    ).toContain('live');
    expect(toComplianceDisplayModel(compliance)?.missingRequirements.length).toBeGreaterThan(0);
  });

  it('builds profile workspace data', () => {
    expect(workspace.platformAccounts.some((account) => account.platform === 'TIKTOK')).toBe(true);
    expect(workspace.compliance?.documentSummary.missing).toBeGreaterThan(0);
  });
});

describe('profile and settings rendering', () => {
  const workspace = buildProfileWorkspaceData({
    creatorProfileId: 'creator_test_001',
    detail: createMockCreatorDetail('creator_test_001'),
    platformAccounts: createMockPlatformAccounts('creator_test_001'),
    skills: createMockCreatorSkills(),
    availability: createMockCreatorAvailability(),
    compliance: createMockCreatorCompliance('creator_test_001'),
  });

  const settings = buildSettingsWorkspaceData({
    profile: createMockUserProfile(),
    mockMode: true,
    version: '0.0.0',
    environment: {
      apiBaseUrl: 'http://localhost:4000',
      creatorProfileId: 'creator_test_001',
      mockMode: true,
      nodeEnv: 'development',
    },
  });

  it('renders creator profile panel', () => {
    const html = renderToStaticMarkup(<CreatorProfilePanel profile={workspace.profile} />);
    expect(html).toContain('Creator Profile');
    expect(html).toContain('Alex Rivera');
    expect(html).toContain('alexrivera.live');
  });

  it('renders platform accounts panel', () => {
    const html = renderToStaticMarkup(
      <PlatformAccountsPanel accounts={workspace.platformAccounts} />,
    );
    expect(html).toContain('Platform Accounts');
    expect(html).toContain('TIKTOK');
    expect(html).toContain('TWITCH');
  });

  it('renders skills and compliance panels', () => {
    const skillsHtml = renderToStaticMarkup(<SkillsCategoriesPanel skills={workspace.skills} />);
    expect(skillsHtml).toContain('Skills &amp; Categories');
    expect(skillsHtml).toContain('Preferred campaign types');

    const complianceHtml = renderToStaticMarkup(
      <CompliancePanel compliance={workspace.compliance} />,
    );
    expect(complianceHtml).toContain('Compliance');
    expect(complianceHtml).toContain('Onboarding checklist');
  });

  it('renders settings sections', () => {
    const generalHtml = renderToStaticMarkup(<SettingsGeneralSection general={settings.general} />);
    expect(generalHtml).toContain('General');
    expect(generalHtml).toContain('alex.rivera@example.com');

    const notificationsHtml = renderToStaticMarkup(<SettingsNotificationsSection />);
    expect(notificationsHtml).toContain('Notification preferences will be available');

    const systemHtml = renderToStaticMarkup(
      <SettingsSystemSection
        mockMode={settings.mockMode}
        version={settings.version}
        environment={settings.environment}
      />,
    );
    expect(systemHtml).toContain('Creator Studio 0.0.0');
    expect(systemHtml).toContain('http://localhost:4000');
  });

  it('renders partial empty states', () => {
    const html = renderToStaticMarkup(
      <>
        <CreatorProfilePanel profile={null} />
        <PlatformAccountsPanel accounts={[]} />
        <CompliancePanel compliance={null} />
        <SettingsGeneralSection general={null} />
      </>,
    );
    expect(html).toContain('No creator profile available.');
    expect(html).toContain('No platform accounts connected.');
    expect(html).toContain('No compliance data available.');
    expect(html).toContain('Account profile unavailable.');
  });
});
