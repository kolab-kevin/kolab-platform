import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateCreatorLiveScheduleInput,
  CreateLiveSessionInput,
  CreatorLiveScheduleListQuery,
  LiveSessionListQuery,
  UpdateCreatorLiveScheduleInput,
  UpdateLiveSessionInput,
  UpdateLiveSessionStatusInput,
} from '@kolab/types';
import {
  CreateCreatorLiveScheduleSchema,
  CreateLiveSessionSchema,
  CreatorLiveScheduleListQuerySchema,
  LiveSessionListQuerySchema,
  UpdateCreatorLiveScheduleSchema,
  UpdateLiveSessionSchema,
  UpdateLiveSessionStatusSchema,
} from '@kolab/types';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LiveIntelligenceService } from './live-intelligence.service';

@ApiTags('live-intelligence')
@ApiBearerAuth('access-token')
@Controller('live')
export class LiveIntelligenceController {
  constructor(private readonly liveIntelligenceService: LiveIntelligenceService) {}

  @Get('sessions')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List live sessions for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated live session list' })
  listSessions(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(LiveSessionListQuerySchema)) query: LiveSessionListQuery,
  ) {
    return this.liveIntelligenceService.listSessions(user, query);
  }

  @Post('sessions')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a scheduled live session' })
  @ApiResponse({ status: 201, description: 'Live session created' })
  @ApiResponse({ status: 404, description: 'Creator or campaign not found' })
  createSession(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateLiveSessionSchema)) body: CreateLiveSessionInput,
  ) {
    return this.liveIntelligenceService.createSession(user, body);
  }

  @Get('sessions/:sessionId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get live session detail' })
  @ApiResponse({ status: 200, description: 'Live session detail' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  getSession(@CurrentUser() user: AccessTokenPayload, @Param('sessionId') sessionId: string) {
    return this.liveIntelligenceService.getSession(user, sessionId);
  }

  @Patch('sessions/:sessionId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update live session fields' })
  @ApiResponse({ status: 200, description: 'Live session updated' })
  @ApiResponse({ status: 404, description: 'Live session or campaign not found' })
  updateSession(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Body(new ZodValidationPipe(UpdateLiveSessionSchema)) body: UpdateLiveSessionInput,
  ) {
    return this.liveIntelligenceService.updateSession(user, sessionId, body);
  }

  @Post('sessions/:sessionId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Transition live session status' })
  @ApiResponse({ status: 200, description: 'Live session status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  updateSessionStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Body(new ZodValidationPipe(UpdateLiveSessionStatusSchema)) body: UpdateLiveSessionStatusInput,
  ) {
    return this.liveIntelligenceService.updateSessionStatus(user, sessionId, body);
  }

  @Get('schedules')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List creator live schedules' })
  @ApiResponse({ status: 200, description: 'Live schedule list' })
  listSchedules(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(CreatorLiveScheduleListQuerySchema))
    query: CreatorLiveScheduleListQuery,
  ) {
    return this.liveIntelligenceService.listSchedules(user, query);
  }

  @Post('schedules')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a creator live schedule' })
  @ApiResponse({ status: 201, description: 'Live schedule created' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  createSchedule(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateCreatorLiveScheduleSchema))
    body: CreateCreatorLiveScheduleInput,
  ) {
    return this.liveIntelligenceService.createSchedule(user, body);
  }

  @Get('schedules/:scheduleId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator live schedule detail' })
  @ApiResponse({ status: 200, description: 'Live schedule detail' })
  @ApiResponse({ status: 404, description: 'Live schedule not found' })
  getSchedule(@CurrentUser() user: AccessTokenPayload, @Param('scheduleId') scheduleId: string) {
    return this.liveIntelligenceService.getSchedule(user, scheduleId);
  }

  @Patch('schedules/:scheduleId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator live schedule' })
  @ApiResponse({ status: 200, description: 'Live schedule updated' })
  @ApiResponse({ status: 404, description: 'Live schedule not found' })
  updateSchedule(
    @CurrentUser() user: AccessTokenPayload,
    @Param('scheduleId') scheduleId: string,
    @Body(new ZodValidationPipe(UpdateCreatorLiveScheduleSchema))
    body: UpdateCreatorLiveScheduleInput,
  ) {
    return this.liveIntelligenceService.updateSchedule(user, scheduleId, body);
  }

  @Delete('schedules/:scheduleId')
  @RequirePermissions('crm:update')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete creator live schedule' })
  @ApiResponse({ status: 204, description: 'Live schedule deleted' })
  @ApiResponse({ status: 404, description: 'Live schedule not found' })
  deleteSchedule(@CurrentUser() user: AccessTokenPayload, @Param('scheduleId') scheduleId: string) {
    return this.liveIntelligenceService.deleteSchedule(user, scheduleId);
  }
}
