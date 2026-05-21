import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Alerta } from './alerta.entity';
import { AlertasService } from './alertas.service';
import { AlertasController } from './alertas.controller';
import { Configuracion } from '../configuracion/configuracion.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alerta,
      Configuracion,
      Vehiculo,
      PlanMantenimiento,
      DocumentoLegal,
    ]),
  ],
  providers: [AlertasService],
  controllers: [AlertasController],
  exports: [AlertasService],
})
export class AlertasModule {}
