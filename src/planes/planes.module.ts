import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanMantenimiento } from './plan-mantenimiento.entity';
import { PlanesService } from './planes.service';
import { PlanesController } from './planes.controller';
import { VehiculosModule } from '../vehiculos/vehiculos.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlanMantenimiento]), VehiculosModule],
  providers: [PlanesService],
  controllers: [PlanesController],
  exports: [PlanesService],
})
export class PlanesModule {}
