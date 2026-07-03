import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsAssignmentsService } from './campaigns-assignments.service';

@Module({
  imports: [AuditModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsAssignmentsService],
  exports: [CampaignsService, CampaignsAssignmentsService],
})
export class CampaignsModule {}
