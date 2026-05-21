import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PrediccionService } from './prediccion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('prediccion')
export class PrediccionController {
  constructor(private readonly prediccionService: PrediccionService) {}

  /**
   * GET /prediccion/flota
   * RF-INN-03 — Snapshots de todos los vehículos activos ordenados por urgencia.
   * Usado por el dashboard para la línea de tiempo.
   */
  @Get('flota')
  async snapshotFlota() {
    const data = await this.prediccionService.getSnapshotFlota();
    return { data, total: data.length };
  }

  /**
   * GET /prediccion/vehiculos/:vehiculoId
   * RF-INN-01 + RF-INN-02 — km/día y predicción completa de un vehículo.
   * Lee el snapshot persistido (calculado en cada registro de km).
   */
  @Get('vehiculos/:vehiculoId')
  async snapshotVehiculo(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    const data = await this.prediccionService.getSnapshotVehiculo(vehiculoId);
    return { data };
  }

  /**
   * POST /prediccion/vehiculos/:vehiculoId/recalcular
   * RF-INN-01 — Fuerza el recálculo de km/día y predicciones de un vehículo.
   * Normalmente llamado automáticamente al registrar km; este endpoint
   * permite dispararlo manualmente (Admin).
   */
  @Post('vehiculos/:vehiculoId/recalcular')
  async recalcular(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    const data = await this.prediccionService.calcularPrediccion(vehiculoId);
    return { message: 'Predicción recalculada', data };
  }
}
