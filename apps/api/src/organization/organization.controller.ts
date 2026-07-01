import type { AccessTokenPayload } from '@kolab/auth';
import type { SwitchOrganizationInput, UpdateOrganizationMemberInput } from '@kolab/types';
import { SwitchOrganizationSchema, UpdateOrganizationMemberSchema } from '@kolab/types';
import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OrganizationRoles, RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrganizationService } from './organization.service';

@ApiTags('organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('current')
  @RequirePermissions('org:read')
  @ApiOperation({ summary: 'Get the authenticated user active organization' })
  @ApiResponse({ status: 200, description: 'Active organization and membership' })
  @ApiResponse({ status: 403, description: 'Organization context required' })
  getCurrent(@CurrentUser() user: AccessTokenPayload) {
    return this.organizationService.getCurrentOrganization(user);
  }

  @Get()
  @RequirePermissions('org:read')
  @ApiOperation({ summary: 'List organizations the authenticated user belongs to' })
  @ApiResponse({ status: 200, description: 'Organization memberships' })
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.organizationService.listOrganizations(user.sub);
  }

  @Post('switch')
  @HttpCode(200)
  @RequirePermissions('org:read')
  @ApiOperation({ summary: 'Switch active organization and issue a new access token' })
  @ApiResponse({ status: 200, description: 'Organization switched' })
  @ApiResponse({ status: 403, description: 'Not a member of the target organization' })
  switchOrganization(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(SwitchOrganizationSchema)) body: SwitchOrganizationInput,
  ) {
    return this.organizationService.switchOrganization(user, body.organizationId);
  }

  @Get('members')
  @RequirePermissions('members:read')
  @ApiOperation({ summary: 'List members of the active organization' })
  @ApiResponse({ status: 200, description: 'Organization members' })
  listMembers(@CurrentUser() user: AccessTokenPayload) {
    return this.organizationService.listMembers(user);
  }

  @Patch('members/:id')
  @RequirePermissions('members:update_role')
  @OrganizationRoles('ORG_OWNER', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Update an organization member role or status' })
  @ApiResponse({ status: 200, description: 'Member updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMember(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') memberUserId: string,
    @Body(new ZodValidationPipe(UpdateOrganizationMemberSchema))
    body: UpdateOrganizationMemberInput,
  ) {
    return this.organizationService.updateMember(user, memberUserId, body);
  }
}
