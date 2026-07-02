import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CreatorsService } from './creators.service';

@Module({
  imports: [AuditModule],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
