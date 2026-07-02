import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateCreatorPlatformAccountInput,
  CreatorListQuery,
  UpdateCreatorInput,
  UpdateCreatorPlatformAccountInput,
} from '@kolab/types';
import {
  CreateCreatorPlatformAccountSchema,
  CreatorListQuerySchema,
  UpdateCreatorPlatformAccountSchema,
  UpdateCreatorSchema,
} from '@kolab/types';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatorsService } from './creators.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

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
