import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaludFinanciera } from './salud-financiera.entity';
import { SaludFinancieraService } from './salud-financiera.service';
import { SaludFinancieraController } from './salud-financiera.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SaludFinanciera])],
  providers: [SaludFinancieraService],
  controllers: [SaludFinancieraController],
  exports: [SaludFinancieraService],
})
export class SaludFinancieraModule {}
