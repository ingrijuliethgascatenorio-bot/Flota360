import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracion } from './configuracion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Configuracion])],
  exports: [TypeOrmModule],
})
export class ConfiguracionModule {}
