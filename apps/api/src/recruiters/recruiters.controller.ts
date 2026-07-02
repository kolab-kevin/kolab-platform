import type { AccessTokenPayload } from '@kolab/auth';
import type { CreateRecruiterProfileInput, UpdateRecruiterProfileInput } from '@kolab/types';
import {
  CreateRecruiterProfileSchema,
  type RecruiterProfileListQuery,
  RecruiterProfileListQuerySchema,
  UpdateRecruiterProfileSchema,
} from '@kolab/types';
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RecruitersService } from './recruiters.service';

@ApiTags('recruiters')
@ApiBearerAuth('access-token')
@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @Get()
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List recruiter profiles for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated recruiter profile list' })
  listRecruiters(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(RecruiterProfileListQuerySchema)) query: RecruiterProfileListQuery,
  ) {
    return this.recruitersService.listRecruiters(user, query);
  }

  @Get(':id')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get recruiter profile detail' })
  @ApiResponse({ status: 200, description: 'Recruiter profile detail' })
  @ApiResponse({ status: 404, description: 'Recruiter profile not found' })
  getRecruiter(@CurrentUser() user: AccessTokenPayload, @Param('id') profileId: string) {
    return this.recruitersService.getRecruiter(user, profileId);
  }

  @Post()
  @HttpCode(201)
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a recruiter profile for an organization member' })
  @ApiResponse({ status: 201, description: 'Recruiter profile created' })
  @ApiResponse({ status: 403, description: 'Manager role required' })
  @ApiResponse({ status: 409, description: 'Profile already exists for user' })
  createRecruiterProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateRecruiterProfileSchema)) body: CreateRecruiterProfileInput,
  ) {
    return this.recruitersService.createRecruiterProfile(user, body);
  }

  @Patch(':id')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update a recruiter profile' })
  @ApiResponse({ status: 200, description: 'Recruiter profile updated' })
  @ApiResponse({ status: 403, description: 'Manager role required' })
  @ApiResponse({ status: 404, description: 'Recruiter profile not found' })
  updateRecruiterProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') profileId: string,
    @Body(new ZodValidationPipe(UpdateRecruiterProfileSchema)) body: UpdateRecruiterProfileInput,
  ) {
    return this.recruitersService.updateRecruiterProfile(user, profileId, body);
  }
}
