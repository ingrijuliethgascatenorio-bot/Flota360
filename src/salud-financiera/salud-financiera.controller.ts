import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SaludFinancieraService } from './salud-financiera.service';
import { FiltroRankingDto } from '../reportes/dto/filtro-reporte.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('salud-financiera')
export class SaludFinancieraController {
  constructor(private readonly saludService: SaludFinancieraService) {}

  /**
   * GET /salud-financiera/insights?periodo=YYYY-MM
   * RF-INN-05 — 3 tarjetas de insight para el dashboard del Administrador.
   */
  @Get('insights')
  async getInsights(@Query('periodo') periodo?: string) {
    const data = await this.saludService.getInsights(periodo);
    return { data };
  }

  /**
   * GET /salud-financiera/ranking?periodo=mes|trimestre|semestre|anio
   * RF-INN-06 — Ranking comparativo de costos de flota con barra proporcional.
   */
  @Get('ranking')
  async getRanking(@Query() dto: FiltroRankingDto) {
    const data = await this.saludService.getRanking(dto.periodo);
    return { data, total: data.length };
  }
}
