import { getProcessMetrics, getTelemetryStatus } from '@kolab/observability';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators/auth.decorators';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('health')
  health() {
    return this.healthService.getHealth();
  }

  @Public()
  @Get('ready')
  async ready() {
    return this.healthService.getReadiness();
  }

  @Public()
  @Get('metrics')
  metrics() {
    return {
      service: 'KŌLAB API',
      timestamp: new Date().toISOString(),
      process: getProcessMetrics(),
      telemetry: getTelemetryStatus(),
    };
  }
}
