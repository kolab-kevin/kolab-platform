import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { LiveIntelligenceController } from './live-intelligence.controller';
import { LiveIntelligenceService } from './live-intelligence.service';
import { LiveIntelligenceCoachAlertsService } from './live-intelligence-coach-alerts.service';
import { LiveIntelligenceEventsService } from './live-intelligence-events.service';
import { LiveIntelligenceGifterRollupsService } from './live-intelligence-gifter-rollups.service';
import { LiveIntelligenceGiftersService } from './live-intelligence-gifters.service';
import { LiveIntelligenceRecommendationsService } from './live-intelligence-recommendations.service';
import { LiveIntelligenceSessionSummaryService } from './live-intelligence-session-summary.service';
import { LiveIntelligenceTimelineService } from './live-intelligence-timeline.service';
import { LiveIntelligenceTriggerAnalysisService } from './live-intelligence-trigger-analysis.service';

@Module({
  imports: [AuditModule],
  controllers: [LiveIntelligenceController],
  providers: [
    LiveIntelligenceService,
    LiveIntelligenceEventsService,
    LiveIntelligenceGiftersService,
    LiveIntelligenceGifterRollupsService,
    LiveIntelligenceTimelineService,
    LiveIntelligenceTriggerAnalysisService,
    LiveIntelligenceSessionSummaryService,
    LiveIntelligenceRecommendationsService,
    LiveIntelligenceCoachAlertsService,
  ],
  exports: [
    LiveIntelligenceService,
    LiveIntelligenceEventsService,
    LiveIntelligenceGiftersService,
    LiveIntelligenceGifterRollupsService,
    LiveIntelligenceTimelineService,
    LiveIntelligenceTriggerAnalysisService,
    LiveIntelligenceSessionSummaryService,
    LiveIntelligenceRecommendationsService,
    LiveIntelligenceCoachAlertsService,
  ],
})
export class LiveIntelligenceModule {}
