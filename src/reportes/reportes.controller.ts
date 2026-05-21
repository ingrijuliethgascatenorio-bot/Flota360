import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { FiltroReporteDto } from './dto/filtro-reporte.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  /**
   * GET /reportes/costos
   * RF-07 — Reporte de costos filtrable por vehículo, técnico y fechas.
   * Solo Administrador.
   */
  @Get('costos')
  async reporteCostos(@Query() filtros: FiltroReporteDto) {
    const data = await this.reportesService.reporteCostos(filtros);
    return { data };
  }
}
