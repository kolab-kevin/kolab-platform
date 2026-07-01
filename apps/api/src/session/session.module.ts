import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '../redis/redis.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [RedisModule, AuditModule],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
