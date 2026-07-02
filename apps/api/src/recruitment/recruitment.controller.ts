import type { AccessTokenPayload } from '@kolab/auth';
import type { CreateLeadInput, UpdateLeadInput } from '@kolab/types';
import { CreateLeadSchema, UpdateLeadSchema } from '@kolab/types';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type RecruitmentLeadListQuery,
  RecruitmentLeadListQuerySchema,
} from './recruitment.queries';
import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@ApiBearerAuth('access-token')
@Controller('recruitment/leads')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  @RequirePermissions('members:read')
  @ApiOperation({ summary: 'List recruitment leads for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated lead list' })
  listLeads(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(RecruitmentLeadListQuerySchema)) query: RecruitmentLeadListQuery,
  ) {
    return this.recruitmentService.listLeads(user, query);
  }

  @Get(':id')
  @RequirePermissions('members:read')
  @ApiOperation({ summary: 'Get recruitment lead detail' })
  @ApiResponse({ status: 200, description: 'Lead detail with related records' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  getLead(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentService.getLead(user, leadId);
  }

  @Post()
  @HttpCode(201)
  @RequirePermissions('members:update_role')
  @ApiOperation({ summary: 'Create a recruitment lead' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  createLead(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateLeadSchema)) body: CreateLeadInput,
  ) {
    return this.recruitmentService.createLead(user, body);
  }

  @Patch(':id')
  @RequirePermissions('members:update_role')
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

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions('members:update_role')
  @ApiOperation({ summary: 'Soft delete a recruitment lead' })
  @ApiResponse({ status: 200, description: 'Lead soft deleted' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  deleteLead(@CurrentUser() user: AccessTokenPayload, @Param('id') leadId: string) {
    return this.recruitmentService.deleteLead(user, leadId);
  }
}
