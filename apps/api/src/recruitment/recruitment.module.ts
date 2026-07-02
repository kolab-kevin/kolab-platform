import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentFollowUpsController } from './recruitment-followups.controller';
import { RecruitmentFollowUpsService } from './recruitment-followups.service';
import { RecruitmentMyLeadsController } from './recruitment-my-leads.controller';
import { RecruitmentNotesService } from './recruitment-notes.service';

@Module({
  imports: [AuditModule],
  controllers: [
    RecruitmentController,
    RecruitmentMyLeadsController,
    RecruitmentFollowUpsController,
  ],
  providers: [RecruitmentService, RecruitmentNotesService, RecruitmentFollowUpsService],
})
export class RecruitmentModule {}
