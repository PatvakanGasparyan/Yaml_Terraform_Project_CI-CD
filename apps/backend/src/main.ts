import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(helmet());
  app.enableCors({
    origin: configService.get('APP_URL', 'http://localhost:3000'),
    credentials: true,
  });

  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('IaC Platform API')
    .setDescription('Enterprise AI-Powered YAML & Terraform Validation Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get('PORT', 4000);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
