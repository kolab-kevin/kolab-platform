import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreatorExpirationNotificationPreviewItem,
  CreatorExpirationNotificationPreviewRequest,
  CreatorExpirationNotificationPreviewResponse,
  ExpiringContractsQuery,
  ExpiringDocumentsQuery,
  MissingDocumentsQuery,
} from '@kolab/types';
import { Injectable } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import {
  assertNotificationPayloadHasNoSecrets,
  buildExpiringContractNotification,
  buildExpiringDocumentNotification,
  buildMissingDocumentNotification,
  summarizeNotificationItems,
} from './creators-notifications.utils';
import { CreatorsReportingService } from './creators-reporting.service';

const PREVIEW_FETCH_LIMIT = 100;

@Injectable()
export class CreatorsNotificationsService {
  constructor(
    private readonly creatorsReportingService: CreatorsReportingService,
    private readonly auditService: AuditService,
  ) {}

  async previewExpirationNotifications(
    user: AccessTokenPayload,
    input: CreatorExpirationNotificationPreviewRequest,
  ): Promise<CreatorExpirationNotificationPreviewResponse> {
    const [
      missingDocumentNotifications,
      expiringDocumentNotifications,
      expiredDocumentNotifications,
      expiringContractNotifications,
      expiredContractNotifications,
    ] = await Promise.all([
      this.buildMissingDocumentNotifications(user, input),
      this.buildExpiringDocumentNotifications(user, input),
      input.includeExpired
        ? this.buildExpiredDocumentNotifications(user, input)
        : Promise.resolve([]),
      this.buildExpiringContractNotifications(user, input),
      input.includeExpired
        ? this.buildExpiredContractNotifications(user, input)
        : Promise.resolve([]),
    ]);

    const items = [
      ...missingDocumentNotifications,
      ...expiringDocumentNotifications,
      ...expiredDocumentNotifications,
      ...expiringContractNotifications,
      ...expiredContractNotifications,
    ];

    assertNotificationPayloadHasNoSecrets(items);

    const organizationId = user.organizationId as string;

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DOCUMENT_NOTIFICATION_PREVIEWED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
      targetId: organizationId,
      metadata: {
        days: input.days,
        includeExpired: input.includeExpired,
        creatorId: input.creatorId ?? null,
        documentType: input.documentType ?? null,
        contractType: input.contractType ?? null,
        summary: summarizeNotificationItems(items),
      },
    });

    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      days: input.days,
      includeExpired: input.includeExpired,
      items,
      summary: summarizeNotificationItems(items),
    };
  }

  async buildMissingDocumentNotifications(
    user: AccessTokenPayload,
    input: CreatorExpirationNotificationPreviewRequest,
  ): Promise<CreatorExpirationNotificationPreviewItem[]> {
    const query: MissingDocumentsQuery = {
      limit: PREVIEW_FETCH_LIMIT,
      ...(input.creatorId ? { creatorId: input.creatorId } : {}),
      ...(input.documentType ? { documentType: input.documentType } : {}),
    };

    const report = await this.creatorsReportingService.listMissingDocuments(user, query);

    return report.items.map(buildMissingDocumentNotification);
  }

  async buildExpiringDocumentNotifications(
    user: AccessTokenPayload,
    input: CreatorExpirationNotificationPreviewRequest,
  ): Promise<CreatorExpirationNotificationPreviewItem[]> {
    const report = await this.creatorsReportingService.listExpiringDocuments(
      user,
      this.toExpiringDocumentsQuery(input, false),
    );

    return report.items
      .filter((item) => item.status === 'EXPIRING')
      .map(buildExpiringDocumentNotification);
  }

  async buildExpiredDocumentNotifications(
    user: AccessTokenPayload,
    input: CreatorExpirationNotificationPreviewRequest,
  ): Promise<CreatorExpirationNotificationPreviewItem[]> {
    const report = await this.creatorsReportingService.listExpiringDocuments(
      user,
      this.toExpiringDocumentsQuery(input, true),
    );

    return report.items
      .filter((item) => item.status === 'EXPIRED')
      .map(buildExpiringDocumentNotification);
  }

  async buildExpiringContractNotifications(
    user: AccessTokenPayload,
    input: CreatorExpirationNotificationPreviewRequest,
  ): Promise<CreatorExpirationNotificationPreviewItem[]> {
    const report = await this.creatorsReportingService.listExpiringContracts(
      user,
      this.toExpiringContractsQuery(input, false),
    );

    return report.items
      .filter((item) => item.status === 'EXPIRING')
      .map(buildExpiringContractNotification);
  }

  async buildExpiredContractNotifications(
    user: AccessTokenPayload,
    input: CreatorExpirationNotificationPreviewRequest,
  ): Promise<CreatorExpirationNotificationPreviewItem[]> {
    const report = await this.creatorsReportingService.listExpiringContracts(
      user,
      this.toExpiringContractsQuery(input, true),
    );

    return report.items
      .filter((item) => item.status === 'EXPIRED')
      .map(buildExpiringContractNotification);
  }

  private toExpiringDocumentsQuery(
    input: CreatorExpirationNotificationPreviewRequest,
    includeExpired: boolean,
  ): ExpiringDocumentsQuery {
    return {
      days: input.days,
      includeExpired,
      limit: PREVIEW_FETCH_LIMIT,
      ...(input.creatorId ? { creatorId: input.creatorId } : {}),
      ...(input.documentType ? { documentType: input.documentType } : {}),
    };
  }

  private toExpiringContractsQuery(
    input: CreatorExpirationNotificationPreviewRequest,
    includeExpired: boolean,
  ): ExpiringContractsQuery {
    return {
      days: input.days,
      includeExpired,
      limit: PREVIEW_FETCH_LIMIT,
      ...(input.creatorId ? { creatorId: input.creatorId } : {}),
      ...(input.contractType ? { contractType: input.contractType } : {}),
    };
  }
}
