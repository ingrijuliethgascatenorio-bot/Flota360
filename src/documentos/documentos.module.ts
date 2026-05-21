import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoLegal } from './documento-legal.entity';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentoLegal]), VehiculosModule, AlertasModule],
  providers: [DocumentosService],
  controllers: [DocumentosController],
})
export class DocumentosModule { }
