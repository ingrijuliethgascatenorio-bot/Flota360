import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
import { OrdenesService } from './ordenes.service';
import { OrdenesController } from './ordenes.controller';
import { PlanesModule } from '../planes/planes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenTrabajo, RepuestoOrden]),
    PlanesModule,
  ],
  providers: [OrdenesService],
  controllers: [OrdenesController],
  exports: [OrdenesService],
})
export class OrdenesModule {}
