import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { FiltrarAlertasDto, UpdateUmbralesDto, FiltroAlerta } from './dto/filtrar-alertas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  // ─── Umbrales configurables — solo Administrador ─────────────────────────

  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('alertas/umbrales')
  async getUmbrales() {
    const data = await this.alertasService.getUmbrales();
    return { data };
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Put('alertas/umbrales')
  async updateUmbrales(@Body() dto: UpdateUmbralesDto) {
    const data = await this.alertasService.actualizarUmbrales(dto.km, dto.dias);
    return { message: 'Umbrales actualizados', data };
  }

  // ─── Alertas por vehículo ─────────────────────────────────────────────────

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get('vehiculos/:vehiculoId/alertas')
  async listarAlertas(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Query() filtrosDto: FiltrarAlertasDto,
    @Request() req,
  ) {
    const filtro      = filtrosDto.filtro       ?? FiltroAlerta.TODAS;
    const soloNoLeidas = filtrosDto.soloNoLeidas ?? true;

    const alertas = await this.alertasService.listarAlertas(
      vehiculoId,
      filtro as 'mantenimiento' | 'documento' | 'todas',
      soloNoLeidas,
      req.user.rol,
    );
    return { data: alertas, total: alertas.length };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Patch('vehiculos/:vehiculoId/alertas/:alertaId/leer')
  async marcarLeida(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Param('alertaId', ParseIntPipe) alertaId: number,
  ) {
    const data = await this.alertasService.marcarLeida(alertaId, vehiculoId);
    return { data };
  }

  // ─── Evaluación manual — solo Administrador ──────────────────────────────

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post('vehiculos/:vehiculoId/alertas/evaluar')
  async evaluarVehiculo(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    const [mant, doc] = await Promise.all([
      this.alertasService.evaluarAlertasMantenimiento(vehiculoId),
      this.alertasService.evaluarAlertasDocumentos(vehiculoId),
    ]);
    return {
      message: 'Evaluación completada',
      data: {
        alertas_mantenimiento: mant,
        alertas_documentos:    doc,
        total_generadas:       mant.length + doc.length,
      },
    };
  }
}
