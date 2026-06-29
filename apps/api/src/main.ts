import 'reflect-metadata';

import { apiEnvSchema, parseEnv } from '@kolab/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { appLogger } from './observability/observability.module';

async function bootstrap() {
  const env = parseEnv(apiEnvSchema);
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'ready', 'metrics'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KŌLAB Platform API')
    .setDescription('Core platform API — authentication, users, and shared services')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addCookieAuth('kolab_refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'kolab_refresh_token',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.PORT, '0.0.0.0');
  appLogger.info({ port: env.PORT }, '@kolab/api started');
  appLogger.info({ url: `http://localhost:${env.PORT}/api/docs` }, 'Swagger docs available');
}

bootstrap().catch((err) => {
  appLogger.fatal({ err }, 'Failed to start @kolab/api');
  process.exit(1);
});
