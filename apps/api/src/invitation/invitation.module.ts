import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';

@Module({
  imports: [AuditModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
