import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { RecruitersController } from './recruiters.controller';
import { RecruitersService } from './recruiters.service';

@Module({
  imports: [AuditModule],
  controllers: [RecruitersController],
  providers: [RecruitersService],
})
export class RecruitersModule {}
