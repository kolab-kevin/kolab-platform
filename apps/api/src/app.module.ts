import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { OrganizationRolesGuard } from './common/guards/organization-roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './health/health.module';
import { InvitationModule } from './invitation/invitation.module';
import { ObservabilityModule } from './observability/observability.module';
import { OrganizationModule } from './organization/organization.module';
import { ProfileModule } from './profile/profile.module';
import { RedisModule } from './redis/redis.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    ObservabilityModule,
    RedisModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    InvitationModule,
    SessionModule,
    AuditModule,
    ProfileModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: OrganizationRolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
