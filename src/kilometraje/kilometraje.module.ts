import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroKm } from './registro-km.entity';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { KilometrajeService } from './kilometraje.service';
import { KilometrajeController } from './kilometraje.controller';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PlanesModule } from '../planes/planes.module';
import { PrediccionModule } from '../prediccion/prediccion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistroKm, AsignacionConductor]),
    VehiculosModule,
    UsuariosModule,
    PlanesModule,
    PrediccionModule,
  ],
  providers: [KilometrajeService],
  controllers: [KilometrajeController],
  exports: [KilometrajeService],
})
export class KilometrajeModule {}
