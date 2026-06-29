import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { apiEnvSchema, parseEnv } from '@kolab/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const env = parseEnv(apiEnvSchema);
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });

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
  console.log(`@kolab/api listening on port ${env.PORT}`);
  console.log(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
}

bootstrap();
