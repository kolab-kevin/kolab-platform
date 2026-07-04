import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsAssignmentsService } from './campaigns-assignments.service';
import { CampaignsCreatorMatchingService } from './campaigns-creator-matching.service';

@Module({
  imports: [AuditModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsAssignmentsService, CampaignsCreatorMatchingService],
  exports: [CampaignsService, CampaignsAssignmentsService, CampaignsCreatorMatchingService],
})
export class CampaignsModule {}
