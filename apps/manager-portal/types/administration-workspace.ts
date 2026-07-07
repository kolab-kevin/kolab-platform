import { z } from 'zod';

export const AdministrationDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type AdministrationDataSource = z.infer<typeof AdministrationDataSourceSchema>;

export const ManagerOrganizationStatisticSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type ManagerOrganizationStatistic = z.infer<typeof ManagerOrganizationStatisticSchema>;

export const ManagerOrganizationProfileSchema = z.object({
  name: z.string(),
  logoUrl: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  phone: z.string().nullable(),
  timezone: z.string(),
  region: z.string(),
  subscriptionTier: z.string(),
  statistics: z.array(ManagerOrganizationStatisticSchema),
});

export type ManagerOrganizationProfile = z.infer<typeof ManagerOrganizationProfileSchema>;

export const ManagerAdminUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  lastLoginLabel: z.string(),
});

export type ManagerAdminUser = z.infer<typeof ManagerAdminUserSchema>;

export const ManagerAdminInvitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  expiresLabel: z.string(),
});

export type ManagerAdminInvitation = z.infer<typeof ManagerAdminInvitationSchema>;

export const ManagerUserManagementSchema = z.object({
  users: z.array(ManagerAdminUserSchema),
  invitations: z.array(ManagerAdminInvitationSchema),
});

export type ManagerUserManagement = z.infer<typeof ManagerUserManagementSchema>;

export const ManagerRoleSummarySchema = z.object({
  role: z.string(),
  label: z.string(),
  memberCount: z.number().int().nonnegative(),
  permissionSummary: z.string(),
});

export type ManagerRoleSummary = z.infer<typeof ManagerRoleSummarySchema>;

export const ManagerPermissionMatrixRowSchema = z.object({
  permission: z.string(),
  roles: z.record(z.string(), z.boolean()),
});

export type ManagerPermissionMatrixRow = z.infer<typeof ManagerPermissionMatrixRowSchema>;

export const ManagerRolesPermissionsSchema = z.object({
  roles: z.array(ManagerRoleSummarySchema),
  permissionMatrix: z.array(ManagerPermissionMatrixRowSchema),
  organizationAccessLabel: z.string(),
});

export type ManagerRolesPermissions = z.infer<typeof ManagerRolesPermissionsSchema>;

export const ManagerSettingItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type ManagerSettingItem = z.infer<typeof ManagerSettingItemSchema>;

export const ManagerFeatureFlagSchema = z.object({
  key: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  readOnly: z.literal(true),
});

export type ManagerFeatureFlag = z.infer<typeof ManagerFeatureFlagSchema>;

export const ManagerOrganizationSettingsSchema = z.object({
  general: z.array(ManagerSettingItemSchema),
  notifications: z.array(ManagerSettingItemSchema),
  branding: z.array(ManagerSettingItemSchema),
  featureFlags: z.array(ManagerFeatureFlagSchema),
  regional: z.array(ManagerSettingItemSchema),
});

export type ManagerOrganizationSettings = z.infer<typeof ManagerOrganizationSettingsSchema>;

export const ManagerAuditEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  actorLabel: z.string(),
  targetLabel: z.string(),
  timestampLabel: z.string(),
  category: z.string(),
});

export type ManagerAuditEntry = z.infer<typeof ManagerAuditEntrySchema>;

export const ManagerAuditCenterSchema = z.object({
  auditLog: z.array(ManagerAuditEntrySchema),
  recentAdminActions: z.array(ManagerAuditEntrySchema),
  securityEvents: z.array(ManagerAuditEntrySchema),
});

export type ManagerAuditCenter = z.infer<typeof ManagerAuditCenterSchema>;

export const ManagerHealthStatusSchema = z.enum(['healthy', 'degraded', 'unknown']);

export type ManagerHealthStatus = z.infer<typeof ManagerHealthStatusSchema>;

export const ManagerSystemHealthSchema = z.object({
  apiStatus: ManagerHealthStatusSchema,
  apiStatusLabel: z.string(),
  queueStatus: ManagerHealthStatusSchema,
  queueStatusLabel: z.string(),
  backgroundJobsLabel: z.string(),
  storageLabel: z.string(),
  storageStatus: ManagerHealthStatusSchema,
  versionLabel: z.string(),
  environmentLabel: z.string(),
});

export type ManagerSystemHealth = z.infer<typeof ManagerSystemHealthSchema>;

export const ManagerConnectedServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  connectedLabel: z.string(),
});

export type ManagerConnectedService = z.infer<typeof ManagerConnectedServiceSchema>;

export const ManagerApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  maskedKey: z.string(),
  createdLabel: z.string(),
});

export type ManagerApiKey = z.infer<typeof ManagerApiKeySchema>;

export const ManagerWebhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  eventsLabel: z.string(),
  status: z.string(),
});

export type ManagerWebhook = z.infer<typeof ManagerWebhookSchema>;

export const ManagerFutureIntegrationSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type ManagerFutureIntegration = z.infer<typeof ManagerFutureIntegrationSchema>;

export const ManagerIntegrationsSchema = z.object({
  connectedServices: z.array(ManagerConnectedServiceSchema),
  apiKeys: z.array(ManagerApiKeySchema),
  webhooks: z.array(ManagerWebhookSchema),
  futureIntegrations: z.array(ManagerFutureIntegrationSchema),
});

export type ManagerIntegrations = z.infer<typeof ManagerIntegrationsSchema>;

export const ManagerAdministrationWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  organizationProfile: ManagerOrganizationProfileSchema,
  userManagement: ManagerUserManagementSchema,
  rolesPermissions: ManagerRolesPermissionsSchema,
  organizationSettings: ManagerOrganizationSettingsSchema,
  auditCenter: ManagerAuditCenterSchema,
  systemHealth: ManagerSystemHealthSchema,
  integrations: ManagerIntegrationsSchema,
});

export type ManagerAdministrationWorkspace = z.infer<typeof ManagerAdministrationWorkspaceSchema>;
