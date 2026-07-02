import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Novedad } from './entities/novedad.entity';
import { NovedadesService } from './novedades.service';
import { NovedadesController } from './novedades.controller';
import { AsignacionesModule } from '../asignaciones/asignaciones.module';
import { OrdenesModule } from '../ordenes/ordenes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Novedad]),
    AsignacionesModule,   // expone AsignacionesService
    OrdenesModule,        // ya exporta OrdenesService
  ],
  providers: [NovedadesService],
  controllers: [NovedadesController],
  exports: [NovedadesService],
})
export class NovedadesModule {}
