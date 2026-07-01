import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuditModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
