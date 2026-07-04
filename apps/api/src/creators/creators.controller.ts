import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateCreatorGoalInput,
  CreateCreatorPlatformAccountInput,
  CreatorComplianceQuery,
  CreatorGoalListQuery,
  CreatorListQuery,
  UpdateCreatorGoalInput,
  UpdateCreatorGoalStatusInput,
  UpdateCreatorInput,
  UpdateCreatorPlatformAccountInput,
  UpdateCreatorSkillsInput,
  UpdateCreatorStructuredAvailabilityInput,
} from '@kolab/types';
import {
  CreateCreatorGoalSchema,
  CreateCreatorPlatformAccountSchema,
  CreatorComplianceQuerySchema,
  CreatorGoalListQuerySchema,
  CreatorListQuerySchema,
  UpdateCreatorGoalSchema,
  UpdateCreatorGoalStatusSchema,
  UpdateCreatorPlatformAccountSchema,
  UpdateCreatorSchema,
  UpdateCreatorSkillsSchema,
  UpdateCreatorStructuredAvailabilitySchema,
} from '@kolab/types';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LiveIntelligenceCreatorProfileService } from '../live-intelligence/live-intelligence-creator-profile.service';
import { LiveIntelligenceLiveTrendsService } from '../live-intelligence/live-intelligence-live-trends.service';
import { CreatorsService } from './creators.service';
import { CreatorsComplianceService } from './creators-compliance.service';
import { CreatorsGoalsService } from './creators-goals.service';
import { CreatorsOnboardingService } from './creators-onboarding.service';
import { CreatorsPerformanceScoreService } from './creators-performance-score.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsController {
  constructor(
    private readonly creatorsService: CreatorsService,
    private readonly creatorsOnboardingService: CreatorsOnboardingService,
    private readonly creatorsComplianceService: CreatorsComplianceService,
    private readonly liveIntelligenceCreatorProfileService: LiveIntelligenceCreatorProfileService,
    private readonly liveIntelligenceLiveTrendsService: LiveIntelligenceLiveTrendsService,
    private readonly creatorsPerformanceScoreService: CreatorsPerformanceScoreService,
    private readonly creatorsGoalsService: CreatorsGoalsService,
  ) {}

  @Get()
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List creators for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated creator list' })
  listCreators(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(CreatorListQuerySchema)) query: CreatorListQuery,
  ) {
    return this.creatorsService.listCreators(user, query);
  }

  @Get(':id/platform-accounts')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List platform accounts for a creator' })
  @ApiResponse({ status: 200, description: 'Creator platform accounts' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  listCreatorPlatformAccounts(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
  ) {
    return this.creatorsService.listCreatorPlatformAccounts(user, creatorId);
  }

  @Post(':id/platform-accounts')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Add a platform account to a creator' })
  @ApiResponse({ status: 201, description: 'Platform account created' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  @ApiResponse({ status: 409, description: 'Duplicate platform account' })
  createCreatorPlatformAccount(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Body(new ZodValidationPipe(CreateCreatorPlatformAccountSchema))
    body: CreateCreatorPlatformAccountInput,
  ) {
    return this.creatorsService.createCreatorPlatformAccount(user, creatorId, body);
  }

  @Patch(':id/platform-accounts/:accountId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update a creator platform account' })
  @ApiResponse({ status: 200, description: 'Platform account updated' })
  @ApiResponse({ status: 404, description: 'Creator or platform account not found' })
  @ApiResponse({ status: 409, description: 'Duplicate platform account' })
  updateCreatorPlatformAccount(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Param('accountId') accountId: string,
    @Body(new ZodValidationPipe(UpdateCreatorPlatformAccountSchema))
    body: UpdateCreatorPlatformAccountInput,
  ) {
    return this.creatorsService.updateCreatorPlatformAccount(user, creatorId, accountId, body);
  }

  @Delete(':id/platform-accounts/:accountId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Remove a creator platform account' })
  @ApiResponse({ status: 200, description: 'Platform account removed' })
  @ApiResponse({ status: 404, description: 'Creator or platform account not found' })
  deleteCreatorPlatformAccount(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.creatorsService.deleteCreatorPlatformAccount(user, creatorId, accountId);
  }

  @Get(':id/skills')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator skills and categories' })
  @ApiResponse({ status: 200, description: 'Creator skills profile' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  getCreatorSkills(@CurrentUser() user: AccessTokenPayload, @Param('id') creatorId: string) {
    return this.creatorsService.getCreatorSkills(user, creatorId);
  }

  @Patch(':id/skills')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator skills and categories' })
  @ApiResponse({ status: 200, description: 'Creator skills updated' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  updateCreatorSkills(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Body(new ZodValidationPipe(UpdateCreatorSkillsSchema)) body: UpdateCreatorSkillsInput,
  ) {
    return this.creatorsService.updateCreatorSkills(user, creatorId, body);
  }

  @Get(':id/availability')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator availability schedule' })
  @ApiResponse({ status: 200, description: 'Creator availability profile' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  getCreatorAvailability(@CurrentUser() user: AccessTokenPayload, @Param('id') creatorId: string) {
    return this.creatorsService.getCreatorAvailability(user, creatorId);
  }

  @Patch(':id/availability')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator availability schedule' })
  @ApiResponse({ status: 200, description: 'Creator availability updated' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  updateCreatorAvailability(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Body(new ZodValidationPipe(UpdateCreatorStructuredAvailabilitySchema))
    body: UpdateCreatorStructuredAvailabilityInput,
  ) {
    return this.creatorsService.updateCreatorAvailability(user, creatorId, body);
  }

  @Get(':id/onboarding')
  @RequirePermissions('documents:read')
  @ApiOperation({ summary: 'Get creator onboarding checklist status' })
  @ApiResponse({ status: 200, description: 'Creator onboarding checklist' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  getCreatorOnboarding(@CurrentUser() user: AccessTokenPayload, @Param('id') creatorId: string) {
    return this.creatorsOnboardingService.getCreatorOnboarding(user, creatorId);
  }

  @Get(':id/compliance')
  @RequirePermissions('documents:read')
  @ApiOperation({ summary: 'Get consolidated creator onboarding and compliance status' })
  @ApiResponse({ status: 200, description: 'Creator compliance bundle' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  getCreatorCompliance(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Query(new ZodValidationPipe(CreatorComplianceQuerySchema)) query: CreatorComplianceQuery,
  ) {
    return this.creatorsComplianceService.getCreatorCompliance(user, creatorId, query);
  }

  @Post(':id/intelligence')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Generate consolidated creator intelligence profile' })
  @ApiResponse({
    status: 201,
    description: 'Creator intelligence profile generated and stored on creator metadata',
  })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  generateCreatorIntelligence(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
  ) {
    return this.liveIntelligenceCreatorProfileService.generateCreatorIntelligence(user, creatorId);
  }

  @Get(':id/intelligence')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Read stored creator intelligence profile' })
  @ApiResponse({ status: 200, description: 'Stored creator intelligence profile' })
  @ApiResponse({ status: 404, description: 'Creator or intelligence profile not found' })
  getCreatorIntelligence(@CurrentUser() user: AccessTokenPayload, @Param('id') creatorId: string) {
    return this.liveIntelligenceCreatorProfileService.getCreatorIntelligence(user, creatorId);
  }

  @Post(':id/trends/live')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Generate creator live trend snapshot' })
  @ApiResponse({
    status: 201,
    description: 'Creator live trend snapshot generated and stored on creator metadata',
  })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  generateCreatorLiveTrends(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
  ) {
    return this.liveIntelligenceLiveTrendsService.generateCreatorLiveTrends(user, creatorId);
  }

  @Get(':id/trends/live')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Read stored creator live trend snapshot' })
  @ApiResponse({ status: 200, description: 'Stored creator live trend snapshot' })
  @ApiResponse({ status: 404, description: 'Creator or live trend snapshot not found' })
  getCreatorLiveTrends(@CurrentUser() user: AccessTokenPayload, @Param('id') creatorId: string) {
    return this.liveIntelligenceLiveTrendsService.getCreatorLiveTrends(user, creatorId);
  }

  @Post(':id/performance-score')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Generate creator performance score' })
  @ApiResponse({
    status: 201,
    description: 'Creator performance score generated and stored on creator metadata',
  })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  generateCreatorPerformanceScore(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
  ) {
    return this.creatorsPerformanceScoreService.generateCreatorPerformanceScore(user, creatorId);
  }

  @Get(':id/performance-score')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Read stored creator performance score' })
  @ApiResponse({ status: 200, description: 'Stored creator performance score' })
  @ApiResponse({ status: 404, description: 'Creator or performance score not found' })
  getCreatorPerformanceScore(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
  ) {
    return this.creatorsPerformanceScoreService.getCreatorPerformanceScore(user, creatorId);
  }

  @Get(':id/goals')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List creator goals' })
  @ApiResponse({ status: 200, description: 'Paginated creator goals' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  listCreatorGoals(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Query(new ZodValidationPipe(CreatorGoalListQuerySchema)) query: CreatorGoalListQuery,
  ) {
    return this.creatorsGoalsService.listCreatorGoals(user, creatorId, query);
  }

  @Get(':id/goals/:goalId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator goal detail' })
  @ApiResponse({ status: 200, description: 'Creator goal detail' })
  @ApiResponse({ status: 404, description: 'Creator or goal not found' })
  getCreatorGoal(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Param('goalId') goalId: string,
  ) {
    return this.creatorsGoalsService.getCreatorGoal(user, creatorId, goalId);
  }

  @Post(':id/goals')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a creator goal' })
  @ApiResponse({ status: 201, description: 'Creator goal created' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  createCreatorGoal(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Body(new ZodValidationPipe(CreateCreatorGoalSchema)) body: CreateCreatorGoalInput,
  ) {
    return this.creatorsGoalsService.createCreatorGoal(user, creatorId, body);
  }

  @Patch(':id/goals/:goalId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update a creator goal' })
  @ApiResponse({ status: 200, description: 'Creator goal updated' })
  @ApiResponse({ status: 404, description: 'Creator or goal not found' })
  updateCreatorGoal(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Param('goalId') goalId: string,
    @Body(new ZodValidationPipe(UpdateCreatorGoalSchema)) body: UpdateCreatorGoalInput,
  ) {
    return this.creatorsGoalsService.updateCreatorGoal(user, creatorId, goalId, body);
  }

  @Post(':id/goals/:goalId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator goal status' })
  @ApiResponse({ status: 200, description: 'Creator goal status updated' })
  @ApiResponse({ status: 404, description: 'Creator or goal not found' })
  updateCreatorGoalStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Param('goalId') goalId: string,
    @Body(new ZodValidationPipe(UpdateCreatorGoalStatusSchema))
    body: UpdateCreatorGoalStatusInput,
  ) {
    return this.creatorsGoalsService.updateCreatorGoalStatus(user, creatorId, goalId, body);
  }

  @Post(':id/goals/:goalId/progress/recalculate')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Recalculate creator goal progress from existing data' })
  @ApiResponse({ status: 201, description: 'Creator goal progress recalculated' })
  @ApiResponse({ status: 404, description: 'Creator or goal not found' })
  recalculateCreatorGoalProgress(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Param('goalId') goalId: string,
  ) {
    return this.creatorsGoalsService.recalculateCreatorGoalProgress(user, creatorId, goalId);
  }

  @Get(':id')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator detail' })
  @ApiResponse({ status: 200, description: 'Creator detail with related records' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  getCreator(@CurrentUser() user: AccessTokenPayload, @Param('id') creatorId: string) {
    return this.creatorsService.getCreator(user, creatorId);
  }

  @Patch(':id')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator profile fields' })
  @ApiResponse({ status: 200, description: 'Creator updated' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  updateCreator(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') creatorId: string,
    @Body(new ZodValidationPipe(UpdateCreatorSchema)) body: UpdateCreatorInput,
  ) {
    return this.creatorsService.updateCreator(user, creatorId, body);
  }
}
