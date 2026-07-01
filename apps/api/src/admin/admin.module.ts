import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemAdminGuard } from './system-admin.guard';

@Module({
  imports: [AuditModule],
  controllers: [AdminController],
  providers: [AdminService, SystemAdminGuard],
})
export class AdminModule {}
