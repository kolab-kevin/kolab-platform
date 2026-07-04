import type { AccessTokenPayload } from '@kolab/auth';
import type {
  BatchIngestLiveEventsInput,
  CreateCreatorLiveScheduleInput,
  CreateLiveSessionInput,
  CreatorLiveScheduleListQuery,
  GifterProfileListQuery,
  GifterProfileSessionsQuery,
  IngestLiveEventInput,
  LiveSessionListQuery,
  SessionGifterListQuery,
  SessionLiveEventListQuery,
  SessionTimelineQuery,
  UpdateCreatorLiveScheduleInput,
  UpdateLiveSessionInput,
  UpdateLiveSessionStatusInput,
} from '@kolab/types';
import {
  BatchIngestLiveEventsSchema,
  CreateCreatorLiveScheduleSchema,
  CreateLiveSessionSchema,
  CreatorLiveScheduleListQuerySchema,
  GifterProfileListQuerySchema,
  GifterProfileSessionsQuerySchema,
  IngestLiveEventInputSchema,
  LiveSessionListQuerySchema,
  SessionGifterListQuerySchema,
  SessionLiveEventListQuerySchema,
  SessionTimelineQuerySchema,
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
import { LiveIntelligenceEventsService } from './live-intelligence-events.service';
import { LiveIntelligenceGifterRollupsService } from './live-intelligence-gifter-rollups.service';
import { LiveIntelligenceGiftersService } from './live-intelligence-gifters.service';
import { LiveIntelligenceSessionSummaryService } from './live-intelligence-session-summary.service';
import { LiveIntelligenceTimelineService } from './live-intelligence-timeline.service';
import { LiveIntelligenceTriggerAnalysisService } from './live-intelligence-trigger-analysis.service';

@ApiTags('live-intelligence')
@ApiBearerAuth('access-token')
@Controller('live')
export class LiveIntelligenceController {
  constructor(
    private readonly liveIntelligenceService: LiveIntelligenceService,
    private readonly liveIntelligenceEventsService: LiveIntelligenceEventsService,
    private readonly liveIntelligenceGiftersService: LiveIntelligenceGiftersService,
    private readonly liveIntelligenceGifterRollupsService: LiveIntelligenceGifterRollupsService,
    private readonly liveIntelligenceTimelineService: LiveIntelligenceTimelineService,
    private readonly liveIntelligenceTriggerAnalysisService: LiveIntelligenceTriggerAnalysisService,
    private readonly liveIntelligenceSessionSummaryService: LiveIntelligenceSessionSummaryService,
  ) {}

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

  @Get('sessions/:sessionId/events')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List append-only events for a live session timeline' })
  @ApiResponse({ status: 200, description: 'Paginated session event timeline' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  listSessionEvents(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Query(new ZodValidationPipe(SessionLiveEventListQuerySchema))
    query: SessionLiveEventListQuery,
  ) {
    return this.liveIntelligenceEventsService.listSessionEvents(user, sessionId, query);
  }

  @Post('sessions/:sessionId/events/batch')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Ingest up to 100 live events for a session' })
  @ApiResponse({ status: 201, description: 'Batch ingest result with created/duplicate counts' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  ingestEventBatch(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Body(new ZodValidationPipe(BatchIngestLiveEventsSchema)) body: BatchIngestLiveEventsInput,
  ) {
    return this.liveIntelligenceEventsService.ingestEventBatch(user, sessionId, body);
  }

  @Post('sessions/:sessionId/events')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Ingest a single append-only live event' })
  @ApiResponse({ status: 201, description: 'Ingest result with created/idempotent flag' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  ingestEvent(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Body(new ZodValidationPipe(IngestLiveEventInputSchema)) body: IngestLiveEventInput,
  ) {
    return this.liveIntelligenceEventsService.ingestEvent(user, sessionId, body);
  }

  @Get('sessions/:sessionId/gifters')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List gifter profiles and stats for a live session' })
  @ApiResponse({ status: 200, description: 'Session gifter rollup list' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  listSessionGifters(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Query(new ZodValidationPipe(SessionGifterListQuerySchema)) query: SessionGifterListQuery,
  ) {
    return this.liveIntelligenceGiftersService.listSessionGifters(user, sessionId, query);
  }

  @Post('sessions/:sessionId/rollups/gifters')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Process live events into gifter profile and session rollups' })
  @ApiResponse({ status: 201, description: 'Gifter rollup processing result' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  processGifterRollups(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveIntelligenceGifterRollupsService.processGifterRollups(user, sessionId);
  }

  @Get('sessions/:sessionId/timeline')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get chronological timeline for a live session' })
  @ApiResponse({ status: 200, description: 'Paginated session timeline' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  getSessionTimeline(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Query(new ZodValidationPipe(SessionTimelineQuerySchema)) query: SessionTimelineQuery,
  ) {
    return this.liveIntelligenceTimelineService.getSessionTimeline(user, sessionId, query);
  }

  @Get('sessions/:sessionId/replay')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get replay segments grouped by timeline offsets' })
  @ApiResponse({ status: 200, description: 'Session replay segments' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  getSessionReplay(@CurrentUser() user: AccessTokenPayload, @Param('sessionId') sessionId: string) {
    return this.liveIntelligenceTimelineService.getSessionReplay(user, sessionId);
  }

  @Get('sessions/:sessionId/highlights')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get deterministic session highlights from timeline data' })
  @ApiResponse({ status: 200, description: 'Session highlight moments' })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  getSessionHighlights(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveIntelligenceTimelineService.getSessionHighlights(user, sessionId);
  }

  @Post('sessions/:sessionId/analysis/triggers')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Generate deterministic gift trigger analysis for a live session' })
  @ApiResponse({
    status: 201,
    description: 'Trigger analysis generated and stored on session metadata',
  })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  generateSessionTriggerAnalysis(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveIntelligenceTriggerAnalysisService.generateSessionTriggerAnalysis(
      user,
      sessionId,
    );
  }

  @Get('sessions/:sessionId/analysis/triggers')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Read stored gift trigger analysis for a live session' })
  @ApiResponse({ status: 200, description: 'Stored trigger analysis' })
  @ApiResponse({ status: 404, description: 'Live session or trigger analysis not found' })
  getSessionTriggerAnalysis(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveIntelligenceTriggerAnalysisService.getSessionTriggerAnalysis(user, sessionId);
  }

  @Post('sessions/:sessionId/summary')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Generate deterministic post-live session summary' })
  @ApiResponse({
    status: 201,
    description: 'Session summary generated and stored on session metadata',
  })
  @ApiResponse({ status: 404, description: 'Live session not found' })
  generateSessionSummary(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveIntelligenceSessionSummaryService.generateSessionSummary(user, sessionId);
  }

  @Get('sessions/:sessionId/summary')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Read stored post-live session summary' })
  @ApiResponse({ status: 200, description: 'Stored session summary' })
  @ApiResponse({ status: 404, description: 'Live session or summary not found' })
  getSessionSummary(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveIntelligenceSessionSummaryService.getSessionSummary(user, sessionId);
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

  @Get('gifters')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List gifter profiles for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated gifter profile list' })
  listGifterProfiles(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(GifterProfileListQuerySchema)) query: GifterProfileListQuery,
  ) {
    return this.liveIntelligenceGiftersService.listGifterProfiles(user, query);
  }

  @Get('gifters/:gifterId/sessions')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List per-session stats for a gifter profile' })
  @ApiResponse({ status: 200, description: 'Paginated gifter session stats' })
  @ApiResponse({ status: 404, description: 'Gifter profile not found' })
  listGifterSessions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('gifterId') gifterId: string,
    @Query(new ZodValidationPipe(GifterProfileSessionsQuerySchema))
    query: GifterProfileSessionsQuery,
  ) {
    return this.liveIntelligenceGiftersService.listGifterSessions(user, gifterId, query);
  }

  @Get('gifters/:gifterId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get gifter profile detail with recent session stats' })
  @ApiResponse({ status: 200, description: 'Gifter profile detail' })
  @ApiResponse({ status: 404, description: 'Gifter profile not found' })
  getGifterProfile(@CurrentUser() user: AccessTokenPayload, @Param('gifterId') gifterId: string) {
    return this.liveIntelligenceGiftersService.getGifterProfile(user, gifterId);
  }
}
