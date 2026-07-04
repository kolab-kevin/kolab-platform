import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { LiveIntelligenceController } from './live-intelligence.controller';
import { LiveIntelligenceService } from './live-intelligence.service';
import { LiveIntelligenceEventsService } from './live-intelligence-events.service';
import { LiveIntelligenceGifterRollupsService } from './live-intelligence-gifter-rollups.service';
import { LiveIntelligenceGiftersService } from './live-intelligence-gifters.service';

@Module({
  imports: [AuditModule],
  controllers: [LiveIntelligenceController],
  providers: [
    LiveIntelligenceService,
    LiveIntelligenceEventsService,
    LiveIntelligenceGiftersService,
    LiveIntelligenceGifterRollupsService,
  ],
  exports: [
    LiveIntelligenceService,
    LiveIntelligenceEventsService,
    LiveIntelligenceGiftersService,
    LiveIntelligenceGifterRollupsService,
  ],
})
export class LiveIntelligenceModule {}
