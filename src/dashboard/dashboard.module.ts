import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrediccionModule } from '../prediccion/prediccion.module';
import { SaludFinancieraModule } from '../salud-financiera/salud-financiera.module';

@Module({
  imports: [PrediccionModule, SaludFinancieraModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
