import type { AccessTokenPayload } from '@kolab/auth';
import type { AdminOrganizationsQuery, AdminUsersQuery, UpdateAdminUserInput } from '@kolab/types';
import {
  AdminOrganizationsQuerySchema,
  AdminUsersQuerySchema,
  UpdateAdminUserSchema,
} from '@kolab/types';
import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminService } from './admin.service';
import { SystemAdminGuard } from './system-admin.guard';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(SystemAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform administration dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Platform statistics' })
  @ApiResponse({ status: 403, description: 'System administrator access required' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List platform users' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  listUsers(@Query(new ZodValidationPipe(AdminUsersQuerySchema)) query: AdminUsersQuery) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a platform user with profile, memberships, and sessions' })
  @ApiResponse({ status: 200, description: 'User detail' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUser(@Param('id') userId: string) {
    return this.adminService.getUser(userId);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update a platform user role or system admin flag' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUser(
    @CurrentUser() actor: AccessTokenPayload,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(UpdateAdminUserSchema)) body: UpdateAdminUserInput,
  ) {
    return this.adminService.updateUser(actor, userId, body);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List platform organizations' })
  @ApiResponse({ status: 200, description: 'Paginated organization list' })
  listOrganizations(
    @Query(new ZodValidationPipe(AdminOrganizationsQuerySchema)) query: AdminOrganizationsQuery,
  ) {
    return this.adminService.listOrganizations(query);
  }
}
