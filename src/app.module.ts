/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

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
import { NovedadesModule } from './novedades/novedades.module';

@Module({
  imports: [
    // ─────────────────────────────────────────────────────────────────────
    // CONFIGURACIÓN
    // ─────────────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─────────────────────────────────────────────────────────────────────
    // BASE DE DATOS
    // ─────────────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        host: config.get<string>('DB_HOST', 'localhost'),

        port: Number(
          config.get<string>('DB_PORT', '5432'),
        ),

        username: config.get<string>(
          'DB_USERNAME',
          'postgres',
        ),

        password: config.getOrThrow<string>(
          'DB_PASSWORD',
        ),

        database: config.get<string>(
          'DB_NAME',
          'flotacontrol',
        ),

        autoLoadEntities: true,

        synchronize: false,

        logging:
          config.get<string>('NODE_ENV') ===
          'development',

        // Supabase
        ssl: {
          rejectUnauthorized: false,
        },

        extra: {
          options: '-c TimeZone=America/Bogota',
        },
      }),

      inject: [ConfigService],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // TAREAS PROGRAMADAS
    // ─────────────────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─────────────────────────────────────────────────────────────────────
    // MÓDULOS DE NEGOCIO
    // ─────────────────────────────────────────────────────────────────────

    // Sprint 1 & 2
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
    NovedadesModule,

    // Dashboard al final
    DashboardModule,
  ],
})
export class AppModule {}