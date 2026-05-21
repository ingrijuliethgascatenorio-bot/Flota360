import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './vehiculo.entity';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculo, DocumentoLegal]),
    forwardRef(() => AlertasModule)
  ],
  providers: [VehiculosService],
  controllers: [VehiculosController],
  exports: [VehiculosService],
})
export class VehiculosModule {}
