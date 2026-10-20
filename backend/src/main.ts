import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { SnakeCaseInterceptor } from './shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // comma-separated list of allowed frontend origins, e.g. the Vercel URL
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length
      ? corsOrigins
      : process.env.NODE_ENV !== 'production',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ShipLink API')
    .setDescription(
      'REST API for ShipLink — a logistics and shipment management platform. ' +
      'Serves the company portal and public website. ' +
      'All endpoints are versioned under /api/v1.',
    )
    .setVersion('1.0')
    .setContact('ShipLink Support', 'shiplink.com/contact', 'gideonbempong533@gmail.com')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    useGlobalPrefix: false,
  });

  app.useGlobalPipes(new ValidationPipe({whitelist: true,}))

  // convert all outgoing JSON to snake_case to match frontend convention
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
