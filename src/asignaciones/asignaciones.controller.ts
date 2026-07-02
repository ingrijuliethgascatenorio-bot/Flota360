import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AsignacionesService } from './asignaciones.service';
import { CreateAsignacionDto } from './dto/create.asignacion.dto';
import { UpdateAsignacionDto } from './dto/update.asignacion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AsignacionesController {
  constructor(private readonly service: AsignacionesService) {}

  // POST /asignaciones
  @Roles(RolUsuario.ADMINISTRADOR)
  @Post('asignaciones')
  crear(@Body() dto: CreateAsignacionDto) {
    return this.service.crear(dto);
  }

  // GET /asignaciones — todas las activas
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('asignaciones')
  listarActivas() {
    return this.service.listarActivas();
  }

  // GET /vehiculos/:id/asignaciones
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get('vehiculos/:id/asignaciones')
  porVehiculo(@Param('id', ParseIntPipe) id: number) {
    return this.service.porVehiculo(id);
  }

  // GET /vehiculos/:id/asignaciones/historial
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('vehiculos/:id/asignaciones/historial')
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.service.historialVehiculo(id);
  }

  // GET /conductores/:id/asignaciones — el conductor puede ver las suyas
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO, RolUsuario.CONDUCTOR)
  @Get('conductores/:id/asignaciones')
  porConductor(@Param('id', ParseIntPipe) id: number) {
    return this.service.porConductor(id);
  }

  // GET /conductores/:id/asignaciones/todas — todas las asignaciones históricas del conductor
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO, RolUsuario.CONDUCTOR)
  @Get('conductores/:id/asignaciones/todas')
  todasPorConductor(@Param('id', ParseIntPipe) id: number) {
    return this.service.todasPorConductor(id);
  }

  // PATCH /asignaciones/:id/desactivar
  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch('asignaciones/:id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.desactivar(id);
  }

  // GET /asignaciones/:id
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('asignaciones/:id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  // PATCH /asignaciones/:id
  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch('asignaciones/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAsignacionDto,
  ) {
    return this.service.actualizar(id, dto);
  }
}
