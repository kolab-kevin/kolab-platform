import type { AccessTokenPayload } from '@kolab/auth';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type FollowUpsQuery, FollowUpsQuerySchema } from './recruitment.queries';
import { RecruitmentFollowUpsService } from './recruitment-followups.service';

@ApiTags('recruitment')
@ApiBearerAuth('access-token')
@Controller('recruitment')
export class RecruitmentFollowUpsController {
  constructor(private readonly recruitmentFollowUpsService: RecruitmentFollowUpsService) {}

  @Get('follow-ups')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List scheduled follow-ups for the current recruiter' })
  @ApiResponse({ status: 200, description: 'Paginated follow-up lead list' })
  listFollowUps(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(FollowUpsQuerySchema)) query: FollowUpsQuery,
  ) {
    return this.recruitmentFollowUpsService.listFollowUps(user, query);
  }
}
