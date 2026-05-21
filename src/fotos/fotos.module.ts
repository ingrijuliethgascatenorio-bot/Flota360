import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { FotoOrden } from './foto-orden.entity';
import { FotosService } from './fotos.service';
import { FotosController } from './fotos.controller';
import { OrdenTrabajo } from '../ordenes/orden-trabajo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FotoOrden, OrdenTrabajo]),
    MulterModule.register({ dest: process.env.UPLOAD_TEMP_DIR ?? 'uploads/temp' }),
  ],
  providers: [FotosService],
  controllers: [FotosController],
  exports: [FotosService],
})
export class FotosModule {}
