import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorsContractsController } from './creators-contracts.controller';
import { CreatorsContractsService } from './creators-contracts.service';
import { CreatorsDocumentsController } from './creators-documents.controller';
import { CreatorsDocumentsService } from './creators-documents.service';

@Module({
  imports: [AuditModule],
  controllers: [CreatorsDocumentsController, CreatorsContractsController, CreatorsController],
  providers: [CreatorsService, CreatorsDocumentsService, CreatorsContractsService],
  exports: [CreatorsService, CreatorsDocumentsService, CreatorsContractsService],
})
export class CreatorsModule {}
