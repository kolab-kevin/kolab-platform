import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { LiveIntelligenceController } from './live-intelligence.controller';
import { LiveIntelligenceService } from './live-intelligence.service';

@Module({
  imports: [AuditModule],
  controllers: [LiveIntelligenceController],
  providers: [LiveIntelligenceService],
  exports: [LiveIntelligenceService],
})
export class LiveIntelligenceModule {}
