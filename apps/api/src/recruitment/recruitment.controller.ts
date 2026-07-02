import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateLeadInput,
  ReassignLeadInput,
  UpdateLeadFollowUpInput,
  UpdateLeadInput,
  UpdateLeadStatusInput,
} from '@kolab/types';
import {
  type AddLeadNoteInput,
  AddLeadNoteSchema,
  CreateLeadSchema,
  ReassignLeadSchema,
  UpdateLeadFollowUpSchema,
  type UpdateLeadNoteInput,
  UpdateLeadNoteSchema,
  UpdateLeadSchema,
  UpdateLeadStatusSchema,
} from '@kolab/types';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatorsService } from '../creators/creators.service';
import {
  type RecruitmentLeadListQuery,
  RecruitmentLeadListQuerySchema,
  type UnassignLeadInput,
  UnassignLeadSchema,
} from './recruitment.queries';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentFollowUpsService } from './recruitment-followups.service';
import { RecruitmentNotesService } from './recruitment-notes.service';

@ApiTags('recruitment')
@ApiBearerAuth('access-token')
@Controller('recruitment/leads')
export class RecruitmentController {
  constructor(
    private readonly recruitmentService: RecruitmentService,
    private readonly recruitmentNotesService: RecruitmentNotesService,
    private readonly recruitmentFollowUpsService: RecruitmentFollowUpsService,
    private readonly creatorsService: CreatorsService,
  ) {}

  @Get()
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List recruitment leads for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated lead list' })
  listLeads(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(RecruitmentLeadListQuerySchema)) query: RecruitmentLeadListQuery,
  ) {
    return this.recruitmentService.listLeads(user, query);
  }

  @Get(':id')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get recruitment lead detail' })
  @ApiResponse({ status: 200, description: 'Lead detail with related records' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  getLead(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentService.getLead(user, leadId);
  }

  @Get(':id/timeline')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get lead activity timeline' })
  @ApiResponse({ status: 200, description: 'Chronological lead timeline' })
  getLeadTimeline(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentNotesService.getLeadTimeline(user, leadId);
  }

  @Get(':id/notes')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List lead notes' })
  @ApiResponse({ status: 200, description: 'Lead notes ordered newest first' })
  listLeadNotes(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentNotesService.listLeadNotes(user, leadId);
  }

  @Post(':id/notes')
  @HttpCode(201)
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Add a lead note' })
  @ApiResponse({ status: 201, description: 'Lead note created' })
  addLeadNote(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Body(new ZodValidationPipe(AddLeadNoteSchema)) body: AddLeadNoteInput,
  ) {
    return this.recruitmentNotesService.addLeadNote(user, leadId, body);
  }

  @Patch(':id/notes/:noteId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update a lead note' })
  @ApiResponse({ status: 200, description: 'Lead note updated' })
  @ApiResponse({ status: 403, description: 'Author or manager required' })
  updateLeadNote(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Param('noteId') noteId: string,
    @Body(new ZodValidationPipe(UpdateLeadNoteSchema)) body: UpdateLeadNoteInput,
  ) {
    return this.recruitmentNotesService.updateLeadNote(user, leadId, noteId, body);
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(200)
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Soft delete a lead note' })
  @ApiResponse({ status: 200, description: 'Lead note soft deleted' })
  deleteLeadNote(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.recruitmentNotesService.deleteLeadNote(user, leadId, noteId);
  }

  @Post()
  @HttpCode(201)
  @RequirePermissions('crm:create')
  @ApiOperation({ summary: 'Create a recruitment lead' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  createLead(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateLeadSchema)) body: CreateLeadInput,
  ) {
    return this.recruitmentService.createLead(user, body);
  }

  @Patch(':id')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update recruitment lead fields' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  updateLead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Body(new ZodValidationPipe(UpdateLeadSchema)) body: UpdateLeadInput,
  ) {
    return this.recruitmentService.updateLead(user, leadId, body);
  }

  @Post(':id/status')
  @HttpCode(200)
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Transition recruitment lead pipeline status' })
  @ApiResponse({ status: 200, description: 'Lead status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  updateLeadStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Body(new ZodValidationPipe(UpdateLeadStatusSchema)) body: UpdateLeadStatusInput,
  ) {
    return this.recruitmentService.updateLeadStatus(user, leadId, body);
  }

  @Post(':id/convert')
  @HttpCode(200)
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Convert a signed lead into a creator roster record' })
  @ApiResponse({ status: 200, description: 'Lead converted to creator' })
  @ApiResponse({ status: 400, description: 'Invalid lead status or missing email' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  convertLead(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.creatorsService.convertLeadFromRecruitment(user, leadId);
  }

  @Patch(':id/follow-up')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Set, update, or clear lead follow-up date' })
  @ApiResponse({ status: 200, description: 'Lead follow-up updated' })
  @ApiResponse({ status: 403, description: 'Not authorized for this lead' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  updateLeadFollowUp(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Body(new ZodValidationPipe(UpdateLeadFollowUpSchema)) body: UpdateLeadFollowUpInput,
  ) {
    return this.recruitmentFollowUpsService.updateLeadFollowUp(user, leadId, body);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions('crm:delete')
  @ApiOperation({ summary: 'Soft delete a recruitment lead' })
  @ApiResponse({ status: 200, description: 'Lead soft deleted' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  deleteLead(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentService.deleteLead(user, leadId);
  }

  @Post(':id/claim')
  @HttpCode(200)
  @RequirePermissions('crm:assign')
  @ApiOperation({ summary: 'Claim an unassigned lead' })
  @ApiResponse({ status: 200, description: 'Lead claimed by the current recruiter' })
  @ApiResponse({ status: 409, description: 'Lead is already claimed' })
  claimLead(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentService.claimLead(user, leadId);
  }

  @Post(':id/reassign')
  @HttpCode(200)
  @RequirePermissions('crm:assign')
  @ApiOperation({ summary: 'Reassign a lead to another recruiter' })
  @ApiResponse({ status: 200, description: 'Lead reassigned' })
  @ApiResponse({ status: 403, description: 'Manager role required' })
  reassignLead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Body(new ZodValidationPipe(ReassignLeadSchema)) body: ReassignLeadInput,
  ) {
    return this.recruitmentService.reassignLead(user, leadId, body);
  }

  @Post(':id/unassign')
  @HttpCode(200)
  @RequirePermissions('crm:assign')
  @ApiOperation({ summary: 'Unassign a lead and return it to the pool' })
  @ApiResponse({ status: 200, description: 'Lead unassigned' })
  @ApiResponse({ status: 403, description: 'Manager role required' })
  unassignLead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') leadId: string,
    @Body(new ZodValidationPipe(UnassignLeadSchema)) body: UnassignLeadInput,
  ) {
    return this.recruitmentService.unassignLead(user, leadId, body);
  }
}
