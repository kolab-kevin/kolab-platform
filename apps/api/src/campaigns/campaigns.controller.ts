import type { AccessTokenPayload } from '@kolab/auth';
import type {
  AcceptCampaignApplicationInput,
  ApplyCampaignApplicationInput,
  CampaignApplicationListQuery,
  CampaignAssignmentListQuery,
  CampaignListQuery,
  CreateCampaignCreatorAssignmentInput,
  CreateCampaignCreatorDeliverableInput,
  CreateCampaignDeliverableInput,
  CreateCampaignInput,
  InviteCampaignApplicationInput,
  RejectCampaignApplicationInput,
  UpdateCampaignCreatorAssignmentStatusInput,
  UpdateCampaignCreatorDeliverableInput,
  UpdateCampaignCreatorDeliverableStatusInput,
  UpdateCampaignDeliverableInput,
  UpdateCampaignDeliverableStatusInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
  WithdrawCampaignApplicationInput,
} from '@kolab/types';
import {
  AcceptCampaignApplicationSchema,
  ApplyCampaignApplicationSchema,
  CampaignApplicationListQuerySchema,
  CampaignAssignmentListQuerySchema,
  CampaignListQuerySchema,
  CreateCampaignCreatorAssignmentSchema,
  CreateCampaignCreatorDeliverableSchema,
  CreateCampaignDeliverableSchema,
  CreateCampaignSchema,
  InviteCampaignApplicationSchema,
  RejectCampaignApplicationSchema,
  UpdateCampaignCreatorAssignmentStatusSchema,
  UpdateCampaignCreatorDeliverableSchema,
  UpdateCampaignCreatorDeliverableStatusSchema,
  UpdateCampaignDeliverableSchema,
  UpdateCampaignDeliverableStatusSchema,
  UpdateCampaignSchema,
  UpdateCampaignStatusSchema,
  WithdrawCampaignApplicationSchema,
} from '@kolab/types';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CampaignsService } from './campaigns.service';
import { CampaignsAssignmentsService } from './campaigns-assignments.service';

@ApiTags('campaigns')
@ApiBearerAuth('access-token')
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly campaignsAssignmentsService: CampaignsAssignmentsService,
  ) {}

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

  @Get(':campaignId/applications')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List campaign creator applications' })
  @ApiResponse({ status: 200, description: 'Campaign applications list' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  listApplications(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Query(new ZodValidationPipe(CampaignApplicationListQuerySchema))
    query: CampaignApplicationListQuery,
  ) {
    return this.campaignsService.listApplications(user, campaignId, query);
  }

  @Post(':campaignId/applications/invite')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Invite a creator to a campaign' })
  @ApiResponse({ status: 201, description: 'Campaign application invite created' })
  @ApiResponse({ status: 404, description: 'Campaign or creator not found' })
  inviteApplication(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Body(new ZodValidationPipe(InviteCampaignApplicationSchema))
    body: InviteCampaignApplicationInput,
  ) {
    return this.campaignsService.inviteApplication(user, campaignId, body);
  }

  @Post(':campaignId/applications/apply')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Submit a creator application to a campaign' })
  @ApiResponse({ status: 201, description: 'Campaign application submitted' })
  @ApiResponse({ status: 404, description: 'Campaign or creator not found' })
  applyToCampaign(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Body(new ZodValidationPipe(ApplyCampaignApplicationSchema))
    body: ApplyCampaignApplicationInput,
  ) {
    return this.campaignsService.applyToCampaign(user, campaignId, body);
  }

  @Post(':campaignId/applications/:applicationId/accept')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Accept a campaign creator application' })
  @ApiResponse({ status: 200, description: 'Campaign application accepted' })
  @ApiResponse({ status: 404, description: 'Campaign or application not found' })
  acceptApplication(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('applicationId') applicationId: string,
    @Body(new ZodValidationPipe(AcceptCampaignApplicationSchema))
    body: AcceptCampaignApplicationInput,
  ) {
    return this.campaignsService.acceptApplication(user, campaignId, applicationId, body);
  }

  @Post(':campaignId/applications/:applicationId/reject')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Reject a campaign creator application' })
  @ApiResponse({ status: 200, description: 'Campaign application rejected' })
  @ApiResponse({ status: 404, description: 'Campaign or application not found' })
  rejectApplication(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('applicationId') applicationId: string,
    @Body(new ZodValidationPipe(RejectCampaignApplicationSchema))
    body: RejectCampaignApplicationInput,
  ) {
    return this.campaignsService.rejectApplication(user, campaignId, applicationId, body);
  }

  @Post(':campaignId/applications/:applicationId/withdraw')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Withdraw a campaign creator application' })
  @ApiResponse({ status: 200, description: 'Campaign application withdrawn' })
  @ApiResponse({ status: 404, description: 'Campaign or application not found' })
  withdrawApplication(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('applicationId') applicationId: string,
    @Body(new ZodValidationPipe(WithdrawCampaignApplicationSchema))
    body: WithdrawCampaignApplicationInput,
  ) {
    return this.campaignsService.withdrawApplication(user, campaignId, applicationId, body);
  }

  @Get(':campaignId/assignments')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List campaign creator assignments' })
  @ApiResponse({ status: 200, description: 'Campaign assignments list' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  listAssignments(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Query(new ZodValidationPipe(CampaignAssignmentListQuerySchema))
    query: CampaignAssignmentListQuery,
  ) {
    return this.campaignsAssignmentsService.listAssignments(user, campaignId, query);
  }

  @Post(':campaignId/assignments')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a campaign creator assignment' })
  @ApiResponse({ status: 201, description: 'Campaign assignment created' })
  @ApiResponse({ status: 404, description: 'Campaign or creator not found' })
  createAssignment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Body(new ZodValidationPipe(CreateCampaignCreatorAssignmentSchema))
    body: CreateCampaignCreatorAssignmentInput,
  ) {
    return this.campaignsAssignmentsService.createAssignment(user, campaignId, body);
  }

  @Get(':campaignId/assignments/:assignmentId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get campaign creator assignment detail' })
  @ApiResponse({ status: 200, description: 'Campaign assignment detail' })
  @ApiResponse({ status: 404, description: 'Campaign or assignment not found' })
  getAssignment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.campaignsAssignmentsService.getAssignment(user, campaignId, assignmentId);
  }

  @Post(':campaignId/assignments/:assignmentId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update campaign creator assignment status' })
  @ApiResponse({ status: 200, description: 'Campaign assignment status updated' })
  @ApiResponse({ status: 404, description: 'Campaign or assignment not found' })
  updateAssignmentStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('assignmentId') assignmentId: string,
    @Body(new ZodValidationPipe(UpdateCampaignCreatorAssignmentStatusSchema))
    body: UpdateCampaignCreatorAssignmentStatusInput,
  ) {
    return this.campaignsAssignmentsService.updateAssignmentStatus(
      user,
      campaignId,
      assignmentId,
      body,
    );
  }

  @Get(':campaignId/assignments/:assignmentId/deliverables')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List creator deliverables for an assignment' })
  @ApiResponse({ status: 200, description: 'Creator deliverables list' })
  @ApiResponse({ status: 404, description: 'Campaign or assignment not found' })
  listCreatorDeliverables(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.campaignsAssignmentsService.listCreatorDeliverables(user, campaignId, assignmentId);
  }

  @Post(':campaignId/assignments/:assignmentId/deliverables')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Link a campaign deliverable to a creator assignment' })
  @ApiResponse({ status: 201, description: 'Creator deliverable created' })
  @ApiResponse({ status: 404, description: 'Campaign, assignment, or deliverable not found' })
  createCreatorDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('assignmentId') assignmentId: string,
    @Body(new ZodValidationPipe(CreateCampaignCreatorDeliverableSchema))
    body: CreateCampaignCreatorDeliverableInput,
  ) {
    return this.campaignsAssignmentsService.createCreatorDeliverable(
      user,
      campaignId,
      assignmentId,
      body,
    );
  }

  @Patch(':campaignId/assignments/:assignmentId/deliverables/:creatorDeliverableId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update a creator deliverable' })
  @ApiResponse({ status: 200, description: 'Creator deliverable updated' })
  @ApiResponse({ status: 404, description: 'Campaign, assignment, or deliverable not found' })
  updateCreatorDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('assignmentId') assignmentId: string,
    @Param('creatorDeliverableId') creatorDeliverableId: string,
    @Body(new ZodValidationPipe(UpdateCampaignCreatorDeliverableSchema))
    body: UpdateCampaignCreatorDeliverableInput,
  ) {
    return this.campaignsAssignmentsService.updateCreatorDeliverable(
      user,
      campaignId,
      assignmentId,
      creatorDeliverableId,
      body,
    );
  }

  @Post(':campaignId/assignments/:assignmentId/deliverables/:creatorDeliverableId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator deliverable status' })
  @ApiResponse({ status: 200, description: 'Creator deliverable status updated' })
  @ApiResponse({ status: 404, description: 'Campaign, assignment, or deliverable not found' })
  updateCreatorDeliverableStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('campaignId') campaignId: string,
    @Param('assignmentId') assignmentId: string,
    @Param('creatorDeliverableId') creatorDeliverableId: string,
    @Body(new ZodValidationPipe(UpdateCampaignCreatorDeliverableStatusSchema))
    body: UpdateCampaignCreatorDeliverableStatusInput,
  ) {
    return this.campaignsAssignmentsService.updateCreatorDeliverableStatus(
      user,
      campaignId,
      assignmentId,
      creatorDeliverableId,
      body,
    );
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
