import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Asegurar directorios de almacenamiento en el sistema de archivos
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
  const ordenesPath = join(uploadsPath, 'ordenes');
  if (!fs.existsSync(ordenesPath)) fs.mkdirSync(ordenesPath, { recursive: true });
  const tempPath = join(uploadsPath, 'temp');
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

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
        origin === 'null' ||
        origin.endsWith('julieth.site')
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

  // Archivos subidos (con cabeceras CORS para permitir carga en PDF y frontend)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // Frontend
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
    index: false,
  });

  // Página principal
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get('/', (_req: Request, res: Response) => {
    res.redirect('/pages/home.html');
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3002;

  await app.listen(port, '0.0.0.0');

  console.log(`FlotaControl backend corriendo en puerto ${port}`);
}

bootstrap();