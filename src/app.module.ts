import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { DocumentosModule } from './documentos/documentos.module';
import { OrdenesModule } from './ordenes/ordenes.module';

import { FotosModule } from './fotos/fotos.module';
import { AlertasModule } from './alertas/alertas.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { KilometrajeModule } from './kilometraje/kilometraje.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';

import { ReportesModule } from './reportes/reportes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrediccionModule } from './prediccion/prediccion.module';
import { SaludFinancieraModule } from './salud-financiera/salud-financiera.module';
import { NovedadesModule } from './novedades/novedades.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        host: config.get('DB_HOST', 'localhost'),
        port: +config.get('DB_PORT', '5432'),

        username: config.get(
          'DB_USERNAME',
          'postgres',
        ),

        password: config.getOrThrow('DB_PASSWORD'),

        database: config.get(
          'DB_NAME',
          'flotacontrol',
        ),

        autoLoadEntities: true,

        synchronize: false,

        logging:
          config.get('NODE_ENV') === 'development',

        ssl: {
          rejectUnauthorized: false,
        },

        extra: {
          options:
            '-c TimeZone=America/Bogota',
        },
      }),

      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    UsuariosModule,
    VehiculosModule,
    DocumentosModule,
    OrdenesModule,

    FotosModule,
    AlertasModule,
    SchedulerModule,
    KilometrajeModule,
    AsignacionesModule,

    ReportesModule,
    PrediccionModule,
    SaludFinancieraModule,
    NovedadesModule,
    DashboardModule,
  ],
})
export class AppModule {}