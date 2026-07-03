import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorsContractsController } from './creators-contracts.controller';
import { CreatorsContractsService } from './creators-contracts.service';
import { CreatorsDocumentsController } from './creators-documents.controller';
import { CreatorsDocumentsService } from './creators-documents.service';
import { CreatorsNotificationsService } from './creators-notifications.service';
import { CreatorsOnboardingService } from './creators-onboarding.service';
import { CreatorsReportingController } from './creators-reporting.controller';
import { CreatorsReportingService } from './creators-reporting.service';

@Module({
  imports: [AuditModule],
  controllers: [
    CreatorsReportingController,
    CreatorsDocumentsController,
    CreatorsContractsController,
    CreatorsController,
  ],
  providers: [
    CreatorsService,
    CreatorsDocumentsService,
    CreatorsContractsService,
    CreatorsReportingService,
    CreatorsNotificationsService,
    CreatorsOnboardingService,
  ],
  exports: [
    CreatorsService,
    CreatorsDocumentsService,
    CreatorsContractsService,
    CreatorsReportingService,
    CreatorsNotificationsService,
    CreatorsOnboardingService,
  ],
})
export class CreatorsModule {}
