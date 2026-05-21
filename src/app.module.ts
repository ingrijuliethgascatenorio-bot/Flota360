/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// ── Sprint 1 & 2 ──────────────────────────────────────────────────────────────
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { DocumentosModule } from './documentos/documentos.module';
import { OrdenesModule } from './ordenes/ordenes.module';

// ── Sprint 3 ──────────────────────────────────────────────────────────────────
import { FotosModule } from './fotos/fotos.module';
import { AlertasModule } from './alertas/alertas.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { KilometrajeModule } from './kilometraje/kilometraje.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';

// ── Sprint 4 ──────────────────────────────────────────────────────────────────
import { ReportesModule } from './reportes/reportes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrediccionModule } from './prediccion/prediccion.module';
import { SaludFinancieraModule } from './salud-financiera/salud-financiera.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'public'),
        exclude: ['/api/{*path}'],
      },
      {
        // uploads/ siempre relativo a la raíz del proyecto (process.cwd())
        // NO relativo a dist/ para que funcione tanto en dev como en prod
        rootPath: join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
        exclude: ['/api/{*path}'],
      },
    ),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: +config.get('DB_PORT', '5432'),
        username: config.get('DB_USER', 'postgres'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.get('DB_NAME', 'flotacontrol'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
        extra: { options: '-c TimeZone=America/Bogota' },
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    // ── Módulos de negocio — en orden de dependencia ──────────────────────────
    AuthModule,
    UsuariosModule,
    VehiculosModule,
    DocumentosModule,
    OrdenesModule,

    // Sprint 3
    FotosModule,
    AlertasModule,
    SchedulerModule,
    KilometrajeModule,
    AsignacionesModule,

    // Sprint 4
    ReportesModule,
    PrediccionModule,
    SaludFinancieraModule,
    DashboardModule, // ← debe ir al final (depende de Prediccion y Salud)
  ],
})
export class AppModule {}
