import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  });

  // ─────────────────────────────────────────────
  // UPLOADS
  // ─────────────────────────────────────────────

  app.useStaticAssets(
    join(process.cwd(), 'uploads'),
    {
      prefix: '/uploads',
    },
  );

  // ─────────────────────────────────────────────
  // FRONTEND
  // ─────────────────────────────────────────────

  const publicPath = join(
    process.cwd(),
    'public',
  );

  console.log(
    '📁 Public path:',
    publicPath,
  );

  console.log(
    '📄 Home existe:',
    existsSync(
      join(
        publicPath,
        'pages',
        'home.html',
      ),
    ),
  );

  app.useStaticAssets(publicPath, {
    prefix: '/',
    index: false,
  });

  // ─────────────────────────────────────────────
  // API
  // ─────────────────────────────────────────────

  app.setGlobalPrefix('api');

  // ─────────────────────────────────────────────
  // HOME
  // ─────────────────────────────────────────────

  app.get('/', (_req, res) => {
    res.sendFile(
      join(
        publicPath,
        'pages',
        'home.html',
      ),
    );
  });

  // ─────────────────────────────────────────────
  // PUERTO
  // ─────────────────────────────────────────────

  const port =
    Number(process.env.PORT) || 3002;

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `🚛 FlotaControl corriendo en puerto ${port}`,
  );
}

bootstrap();