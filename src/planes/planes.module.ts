import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanMantenimiento } from './plan-mantenimiento.entity';
import { PlanesService } from './planes.service';
import { PlanesController } from './planes.controller';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { Alerta } from '../alertas/alerta.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanMantenimiento, Alerta, Vehiculo]),
    VehiculosModule,
  ],
  providers: [PlanesService],
  controllers: [PlanesController],
  exports: [PlanesService],
})
export class PlanesModule {}
