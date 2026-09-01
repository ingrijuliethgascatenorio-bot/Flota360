import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conductores/mis-mantenimientos')
export class ConductoresMantenimientosController {
  constructor(private readonly service: OrdenesService) {}

  /**
   * GET /conductores/mis-mantenimientos
   * Lista órdenes de trabajo CERRADAS de vehículos que el conductor tiene o tuvo asignados.
   */
  @Roles(RolUsuario.CONDUCTOR)
  @Get()
  misMantenimientos(@Request() req) {
    return this.service.listarPorConductor(req.user.id);
  }

  /**
   * GET /conductores/mis-mantenimientos/:id
   * Detalle seguro de un mantenimiento cerrado para el conductor autenticado.
   */
  @Roles(RolUsuario.CONDUCTOR)
  @Get(':id')
  detalleMantenimiento(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.buscarPorConductor(req.user.id, id);
  }
}
