import 'reflect-metadata';

import { coreApiEnvSchema, parseEnv } from '@kolab/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const env = parseEnv(coreApiEnvSchema);
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`@kolab/public-api listening on port ${env.PORT}`);
}

bootstrap();
