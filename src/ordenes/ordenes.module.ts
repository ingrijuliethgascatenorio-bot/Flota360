import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { Novedad } from '../novedades/entities/novedad.entity';
import { OrdenesService } from './ordenes.service';
import { OrdenesController } from './ordenes.controller';
import { ConductoresMantenimientosController } from './conductores-mantenimientos.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { PlanesModule } from '../planes/planes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenTrabajo,
      RepuestoOrden,
      DocumentoLegal,
      AsignacionConductor,
      PlanMantenimiento,
      Novedad,
    ]),
    PlanesModule,
  ],
  providers: [OrdenesService, DisponibilidadService],
  controllers: [OrdenesController, ConductoresMantenimientosController],
  exports: [OrdenesService, DisponibilidadService],
})
export class OrdenesModule {}
