import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionConductor } from './asignacion_conductor.entity';
import { AsignacionesService } from './asignaciones.service';
import { AsignacionesController } from './asignaciones.controller';
import { DocumentoLegal } from '../documentos/documento-legal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AsignacionConductor, DocumentoLegal])],
  providers: [AsignacionesService],
  controllers: [AsignacionesController],
  exports: [AsignacionesService],
})
export class AsignacionesModule {}
