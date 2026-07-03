import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreatorExpirationNotificationPreviewRequest,
  ExpiringContractsQuery,
  ExpiringDocumentsQuery,
  MissingDocumentsQuery,
} from '@kolab/types';
import {
  CreatorExpirationNotificationPreviewRequestSchema,
  ExpiringContractsQuerySchema,
  ExpiringDocumentsQuerySchema,
  MissingDocumentsQuerySchema,
} from '@kolab/types';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatorsNotificationsService } from './creators-notifications.service';
import { CreatorsReportingService } from './creators-reporting.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsReportingController {
  constructor(
    private readonly creatorsReportingService: CreatorsReportingService,
    private readonly creatorsNotificationsService: CreatorsNotificationsService,
  ) {}

  @Post('documents/notifications/preview')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Preview expiration notification payloads for the organization' })
  @ApiResponse({ status: 200, description: 'Notification preview payloads generated' })
  previewExpirationNotifications(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreatorExpirationNotificationPreviewRequestSchema))
    body: CreatorExpirationNotificationPreviewRequest,
  ) {
    return this.creatorsNotificationsService.previewExpirationNotifications(user, body);
  }

  @Get('documents/expiring')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List expiring or expired creator documents for the organization' })
  @ApiResponse({ status: 200, description: 'Expiring creator documents report' })
  listExpiringDocuments(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(ExpiringDocumentsQuerySchema)) query: ExpiringDocumentsQuery,
  ) {
    return this.creatorsReportingService.listExpiringDocuments(user, query);
  }

  @Get('documents/missing')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List active creators missing required documents' })
  @ApiResponse({ status: 200, description: 'Missing creator documents report' })
  listMissingDocuments(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(MissingDocumentsQuerySchema)) query: MissingDocumentsQuery,
  ) {
    return this.creatorsReportingService.listMissingDocuments(user, query);
  }

  @Get('contracts/expiring')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List expiring or expired creator contracts for the organization' })
  @ApiResponse({ status: 200, description: 'Expiring creator contracts report' })
  listExpiringContracts(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(ExpiringContractsQuerySchema)) query: ExpiringContractsQuery,
  ) {
    return this.creatorsReportingService.listExpiringContracts(user, query);
  }
}
