import { apiEnvSchema, parseEnv } from '@kolab/config';
import {
  createLogger,
  GlobalExceptionFilter,
  initSentry,
  initTelemetry,
  type Logger,
  requestIdMiddleware,
} from '@kolab/observability';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

const env = parseEnv(apiEnvSchema);
export const appLogger: Logger = createLogger({
  level: env.LOG_LEVEL,
  serviceName: env.OTEL_SERVICE_NAME,
  pretty: env.NODE_ENV !== 'production',
});

initSentry({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
initTelemetry({ serviceName: env.OTEL_SERVICE_NAME, endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT });

@Module({
  providers: [{ provide: APP_FILTER, useFactory: () => new GlobalExceptionFilter(appLogger) }],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(requestIdMiddleware()).forRoutes('*');
  }
}
