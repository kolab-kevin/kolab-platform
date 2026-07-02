import type { AccessTokenPayload } from '@kolab/auth';
import type { CreatorListQuery, UpdateCreatorInput } from '@kolab/types';
import { CreatorListQuerySchema, UpdateCreatorSchema } from '@kolab/types';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
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
