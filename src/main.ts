import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.includes('ngrok') ||
        origin === 'null'
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado para: ${origin}`));
      }
    },

    credentials: true,

    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  });

  // Archivos de uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Frontend
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
    index: false,
  });

  // Home
  app.get('/', (_req, res) => {
    res.redirect('/pages/home.html');
  });

  // API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3002;

  await app.listen(port);

  console.log(
    `FlotaControl backend corriendo en http://localhost:${port}/api`,
  );
}

bootstrap();