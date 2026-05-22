import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: '*',
    allowedHeaders: '*',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('Task Manager / Kanban Board REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('users')
    .addTag('boards')
    .addTag('columns')
    .addTag('tasks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: '/api/docs.json',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`TaskFlow API running on host:${port}`);
  console.log(`Swagger docs at host:${port}/api/docs`);
  console.log(`OpenAPI spec at host:${port}/api/docs.json`);
}
bootstrap();
