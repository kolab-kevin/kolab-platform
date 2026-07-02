import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';

@Module({
  imports: [AuditModule],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
