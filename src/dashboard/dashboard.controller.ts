import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard
   * RF-08 — Panel principal semáforo de toda la flota.
   * Incluye insights financieros (RF-INN-05) y predicciones (RF-INN-03).
   * Administrador y Técnico pueden consultar.
   */
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get()
  async getDashboard(@Request() req) {
    const data = await this.dashboardService.getDashboard(req.user.rol);
    return { data };
  }

  /**
   * GET /dashboard/vehiculos/:vehiculoId
   * RF-08 — Detalle del semáforo al hacer clic sobre un vehículo.
   * Muestra alertas activas, planes y documentos legales.
   */
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get('vehiculos/:vehiculoId')
  async getDetalleVehiculo(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Request() req,
  ) {
    const data = await this.dashboardService.getDetalleVehiculo(vehiculoId, req.user.rol);
    return { data };
  }
}
