import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateCreatorPlatformAccountInput,
  CreatorComplianceQuery,
  CreatorListQuery,
  UpdateCreatorInput,
  UpdateCreatorPlatformAccountInput,
  UpdateCreatorSkillsInput,
  UpdateCreatorStructuredAvailabilityInput,
} from '@kolab/types';
import {
  CreateCreatorPlatformAccountSchema,
  CreatorComplianceQuerySchema,
  CreatorListQuerySchema,
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
import { CreatorsService } from './creators.service';
import { CreatorsComplianceService } from './creators-compliance.service';
import { CreatorsOnboardingService } from './creators-onboarding.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsController {
  constructor(
    private readonly creatorsService: CreatorsService,
    private readonly creatorsOnboardingService: CreatorsOnboardingService,
    private readonly creatorsComplianceService: CreatorsComplianceService,
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
