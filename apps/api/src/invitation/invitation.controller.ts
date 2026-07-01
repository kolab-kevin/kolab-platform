import type { AccessTokenPayload } from '@kolab/auth';
import type {
  AcceptInvitationInput,
  CreateInvitationInput,
  InvitationListQuery,
} from '@kolab/types';
import {
  AcceptInvitationSchema,
  CreateInvitationSchema,
  InvitationListQuerySchema,
} from '@kolab/types';
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public, RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { InvitationService } from './invitation.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @HttpCode(201)
  @ApiBearerAuth('access-token')
  @RequirePermissions('members:invite')
  @ApiOperation({ summary: 'Create an organization invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @ApiResponse({ status: 409, description: 'Pending invitation or active member exists' })
  createInvitation(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(CreateInvitationSchema)) body: CreateInvitationInput,
  ) {
    return this.invitationService.createInvitation(user, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @RequirePermissions('members:invite')
  @ApiOperation({ summary: 'List invitations for the active organization' })
  @ApiResponse({ status: 200, description: 'Invitation list' })
  listInvitations(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(InvitationListQuerySchema)) query: InvitationListQuery,
  ) {
    return this.invitationService.listInvitations(user, query);
  }

  @Public()
  @Post('accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept an invitation using its token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted' })
  @ApiResponse({ status: 401, description: 'Invalid invitation token' })
  acceptInvitation(
    @Body(new ZodValidationPipe(AcceptInvitationSchema)) body: AcceptInvitationInput,
  ) {
    return this.invitationService.acceptInvitation(body);
  }

  @Post(':id/revoke')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @RequirePermissions('members:invite')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  revokeInvitation(@CurrentUser() user: AccessTokenPayload, @Param('id') invitationId: string) {
    return this.invitationService.revokeInvitation(user, invitationId);
  }
}
