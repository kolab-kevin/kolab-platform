import type { AccessTokenPayload } from '@kolab/auth';
import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionService } from './session.service';

@ApiTags('sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: 'List active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Active session list' })
  listSessions(@CurrentUser() user: AccessTokenPayload) {
    return this.sessionService.listActiveSessions(user);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the current session from JWT sessionId' })
  @ApiResponse({ status: 200, description: 'Current session' })
  @ApiResponse({ status: 400, description: 'Session id missing from token' })
  @ApiResponse({ status: 404, description: 'Current session not found' })
  getCurrentSession(@CurrentUser() user: AccessTokenPayload) {
    return this.sessionService.getCurrentSession(user);
  }

  @Post('revoke-others')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke all sessions except the current session' })
  @ApiResponse({ status: 200, description: 'Other sessions revoked' })
  @ApiResponse({ status: 400, description: 'Session id missing from token' })
  revokeOtherSessions(@CurrentUser() user: AccessTokenPayload) {
    return this.sessionService.revokeOtherSessions(user);
  }

  @Post(':id/revoke')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke one session belonging to the current user' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  revokeSession(@CurrentUser() user: AccessTokenPayload, @Param('id') sessionId: string) {
    return this.sessionService.revokeSession(user, sessionId);
  }
}
