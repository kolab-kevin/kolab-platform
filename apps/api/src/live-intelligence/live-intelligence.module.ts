import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { LiveIntelligenceController } from './live-intelligence.controller';
import { LiveIntelligenceService } from './live-intelligence.service';
import { LiveIntelligenceEventsService } from './live-intelligence-events.service';

@Module({
  imports: [AuditModule],
  controllers: [LiveIntelligenceController],
  providers: [LiveIntelligenceService, LiveIntelligenceEventsService],
  exports: [LiveIntelligenceService, LiveIntelligenceEventsService],
})
export class LiveIntelligenceModule {}
