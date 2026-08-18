import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionConductor } from './asignacion_conductor.entity';
import { AsignacionesService } from './asignaciones.service';
import { AsignacionesController } from './asignaciones.controller';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsignacionConductor,
      DocumentoLegal,
      Vehiculo,
      PlanMantenimiento,
    ]),
  ],
  providers: [AsignacionesService],
  controllers: [AsignacionesController],
  exports: [AsignacionesService],
})
export class AsignacionesModule {}
