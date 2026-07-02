import type { AccessTokenPayload } from '@kolab/auth';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type MyLeadsQuery, MyLeadsQuerySchema } from './recruitment.queries';
import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@ApiBearerAuth('access-token')
@Controller('recruitment')
export class RecruitmentMyLeadsController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('my-leads')
  @RequirePermissions('crm:assign')
  @ApiOperation({ summary: 'List leads assigned to the current recruiter' })
  @ApiResponse({ status: 200, description: 'Paginated list of assigned leads' })
  listMyLeads(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(MyLeadsQuerySchema)) query: MyLeadsQuery,
  ) {
    return this.recruitmentService.listMyLeads(user, query);
  }
}
