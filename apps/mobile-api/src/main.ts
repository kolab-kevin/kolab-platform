import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { coreApiEnvSchema, parseEnv } from '@kolab/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const env = parseEnv(coreApiEnvSchema);
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await app.listen(env.PORT, '0.0.0.0');
  console.log(`@kolab/mobile-api listening on port ${env.PORT}`);
}

bootstrap();
