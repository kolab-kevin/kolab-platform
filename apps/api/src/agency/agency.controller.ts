import type { AccessTokenPayload } from '@kolab/auth';
import type { UpdateAgencyProfileInput, UpdateAgencySettingsInput } from '@kolab/types';
import { UpdateAgencyProfileSchema, UpdateAgencySettingsSchema } from '@kolab/types';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AgencyService } from './agency.service';

@ApiTags('agency')
@ApiBearerAuth('access-token')
@Controller('agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get()
  @RequirePermissions('org:read')
  @ApiOperation({ summary: 'Get the current agency profile' })
  @ApiResponse({ status: 200, description: 'Agency profile' })
  @ApiResponse({ status: 403, description: 'Agency organization required' })
  getProfile(@CurrentUser() user: AccessTokenPayload) {
    return this.agencyService.getProfile(user);
  }

  @Patch()
  @RequirePermissions('org:update')
  @ApiOperation({ summary: 'Update the current agency profile' })
  @ApiResponse({ status: 200, description: 'Updated agency profile' })
  @ApiResponse({ status: 403, description: 'Agency organization or permission required' })
  updateProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(UpdateAgencyProfileSchema)) body: UpdateAgencyProfileInput,
  ) {
    return this.agencyService.updateProfile(user, body);
  }

  @Get('settings')
  @RequirePermissions('org:read')
  @ApiOperation({ summary: 'Get agency operational settings' })
  @ApiResponse({ status: 200, description: 'Agency settings' })
  getSettings(@CurrentUser() user: AccessTokenPayload) {
    return this.agencyService.getSettings(user);
  }

  @Patch('settings')
  @RequirePermissions('org:update')
  @ApiOperation({ summary: 'Update agency operational settings' })
  @ApiResponse({ status: 200, description: 'Updated agency settings' })
  updateSettings(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(UpdateAgencySettingsSchema)) body: UpdateAgencySettingsInput,
  ) {
    return this.agencyService.updateSettings(user, body);
  }
}
