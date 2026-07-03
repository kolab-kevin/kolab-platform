import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CampaignListQuery,
  CreateCampaignDeliverableInput,
  CreateCampaignInput,
  UpdateCampaignDeliverableInput,
  UpdateCampaignDeliverableStatusInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
} from '@kolab/types';
import {
  CampaignListQuerySchema,
  CreateCampaignDeliverableSchema,
  CreateCampaignSchema,
  UpdateCampaignDeliverableSchema,
  UpdateCampaignDeliverableStatusSchema,
  UpdateCampaignSchema,
  UpdateCampaignStatusSchema,
} from '@kolab/types';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CampaignsService } from './campaigns.service';

@ApiTags('campaigns')
@ApiBearerAuth('access-token')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List campaigns for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated campaign list' })
  listCampaigns(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(CampaignListQuerySchema)) query: CampaignListQuery,
  ) {
    return this.campaignsService.listCampaigns(user, query);
  }

  @Get(':campaignId/deliverables')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List deliverables for a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deliverables list' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  listDeliverables(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignsService.listDeliverables(user, campaignId);
  }

  @Post(':campaignId/deliverables')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a campaign deliverable' })
  @ApiResponse({ status: 201, description: 'Campaign deliverable created' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  createDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Body(new ZodValidationPipe(CreateCampaignDeliverableSchema))
    body: CreateCampaignDeliverableInput,
  ) {
    return this.campaignsService.createDeliverable(user, campaignId, body);
  }

  @Patch(':campaignId/deliverables/:deliverableId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update a campaign deliverable' })
  @ApiResponse({ status: 200, description: 'Campaign deliverable updated' })
  @ApiResponse({ status: 404, description: 'Campaign or deliverable not found' })
  updateDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('deliverableId') deliverableId: string,
    @Body(new ZodValidationPipe(UpdateCampaignDeliverableSchema))
    body: UpdateCampaignDeliverableInput,
  ) {
    return this.campaignsService.updateDeliverable(user, campaignId, deliverableId, body);
  }

  @Post(':campaignId/deliverables/:deliverableId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update campaign deliverable status' })
  @ApiResponse({ status: 200, description: 'Campaign deliverable status updated' })
  @ApiResponse({ status: 404, description: 'Campaign or deliverable not found' })
  updateDeliverableStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('deliverableId') deliverableId: string,
    @Body(new ZodValidationPipe(UpdateCampaignDeliverableStatusSchema))
    body: UpdateCampaignDeliverableStatusInput,
  ) {
    return this.campaignsService.updateDeliverableStatus(user, campaignId, deliverableId, body);
  }

  @Get(':campaignId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get campaign detail' })
  @ApiResponse({ status: 200, description: 'Campaign detail' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getCampaign(@CurrentUser() user: AccessTokenPayload, @Param('campaignId') campaignId: string) {
    return this.campaignsService.getCampaign(user, campaignId);
  }

  @Post()
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  createCampaign(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateCampaignSchema)) body: CreateCampaignInput,
  ) {
    return this.campaignsService.createCampaign(user, body);
  }

  @Patch(':campaignId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update campaign fields' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  updateCampaign(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Body(new ZodValidationPipe(UpdateCampaignSchema)) body: UpdateCampaignInput,
  ) {
    return this.campaignsService.updateCampaign(user, campaignId, body);
  }

  @Post(':campaignId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update campaign workflow status' })
  @ApiResponse({ status: 200, description: 'Campaign status updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  updateCampaignStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Body(new ZodValidationPipe(UpdateCampaignStatusSchema)) body: UpdateCampaignStatusInput,
  ) {
    return this.campaignsService.updateCampaignStatus(user, campaignId, body);
  }
}
