import type { AccessTokenPayload } from '@kolab/auth';
import type { UpdateProfileInput } from '@kolab/types';
import { UpdateProfileSchema } from '@kolab/types';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@ApiBearerAuth('access-token')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User account and profile fields' })
  getProfile(@CurrentUser() user: AccessTokenPayload) {
    return this.profileService.getProfile(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Updated user account and profile fields' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  updateProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profileService.updateProfile(user, body);
  }
}
