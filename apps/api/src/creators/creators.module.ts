import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { LiveIntelligenceModule } from '../live-intelligence/live-intelligence.module';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorsComplianceService } from './creators-compliance.service';
import { CreatorsContractsController } from './creators-contracts.controller';
import { CreatorsContractsService } from './creators-contracts.service';
import { CreatorsDashboardService } from './creators-dashboard.service';
import { CreatorsDocumentsController } from './creators-documents.controller';
import { CreatorsDocumentsService } from './creators-documents.service';
import { CreatorsGoalsService } from './creators-goals.service';
import { CreatorsNotificationsService } from './creators-notifications.service';
import { CreatorsOnboardingService } from './creators-onboarding.service';
import { CreatorsPerformanceScoreService } from './creators-performance-score.service';
import { CreatorsReportingController } from './creators-reporting.controller';
import { CreatorsReportingService } from './creators-reporting.service';

@Module({
  imports: [AuditModule, LiveIntelligenceModule],
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
    CreatorsComplianceService,
    CreatorsPerformanceScoreService,
    CreatorsGoalsService,
    CreatorsDashboardService,
  ],
  exports: [
    CreatorsService,
    CreatorsDocumentsService,
    CreatorsContractsService,
    CreatorsReportingService,
    CreatorsNotificationsService,
    CreatorsOnboardingService,
    CreatorsComplianceService,
    CreatorsPerformanceScoreService,
    CreatorsGoalsService,
    CreatorsDashboardService,
  ],
})
export class CreatorsModule {}
