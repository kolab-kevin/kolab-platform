import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentMyLeadsController } from './recruitment-my-leads.controller';

@Module({
  imports: [AuditModule],
  controllers: [RecruitmentController, RecruitmentMyLeadsController],
  providers: [RecruitmentService],
})
export class RecruitmentModule {}
