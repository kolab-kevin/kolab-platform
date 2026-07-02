import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';

@Module({
  imports: [AuditModule],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
})
export class RecruitmentModule {}
