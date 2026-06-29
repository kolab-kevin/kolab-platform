import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { OrganizationRolesGuard } from './common/guards/organization-roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { OrganizationModule } from './organization/organization.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ObservabilityModule, RedisModule, HealthModule, AuthModule, OrganizationModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: OrganizationRolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
