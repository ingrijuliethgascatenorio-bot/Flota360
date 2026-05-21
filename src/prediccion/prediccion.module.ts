import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrediccionVehiculo } from './prediccion-vehiculo.entity';
import { PrediccionService } from './prediccion.service';
import { PrediccionController } from './prediccion.controller';
import { Alerta } from '../alertas/alerta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrediccionVehiculo, Alerta])],
  providers: [PrediccionService],
  controllers: [PrediccionController],
  exports: [PrediccionService],
})
export class PrediccionModule {}
