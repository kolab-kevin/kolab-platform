import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorsDocumentsController } from './creators-documents.controller';
import { CreatorsDocumentsService } from './creators-documents.service';

@Module({
  imports: [AuditModule],
  controllers: [CreatorsDocumentsController, CreatorsController],
  providers: [CreatorsService, CreatorsDocumentsService],
  exports: [CreatorsService, CreatorsDocumentsService],
})
export class CreatorsModule {}
