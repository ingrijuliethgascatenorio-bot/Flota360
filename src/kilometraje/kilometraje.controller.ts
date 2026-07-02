import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { KilometrajeService } from './kilometraje.service';
import { CreateRegistroKmDto } from './dto/create-registro-km.dto';
import { CerrarPendienteDto } from './dto/cerrar-pendiente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehiculos/:vehiculoId/kilometraje')
export class KilometrajeController {
  constructor(private readonly service: KilometrajeService) {}

  @Roles(RolUsuario.CONDUCTOR, RolUsuario.ADMINISTRADOR)
  @Post()
  registrar(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Request() req,
    @Body() dto: CreateRegistroKmDto,
  ) {
    return this.service.registrar(vehiculoId, req.user.id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO, RolUsuario.CONDUCTOR)
  @Get()
  historial(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    return this.service.historial(vehiculoId);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get('km-por-dia')
  kmPorDia(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    return this.service.calcularKmPorDia(vehiculoId);
  }

  // ── REGLA 4: El conductor llama esto al seleccionar un vehículo
  //    con momento = inicio. El backend detecta su turno de hoy
  //    y devuelve el km encadenado automáticamente.
  //    GET /vehiculos/:id/kilometraje/km-inicio
  @Roles(RolUsuario.CONDUCTOR, RolUsuario.ADMINISTRADOR)
  @Get('km-inicio')
  kmInicioEncadenado(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Request() req,
  ) {
    return this.service.kmInicioEncadenado(vehiculoId, req.user.id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conductores/:conductorId/kilometraje')
export class ConductorKilometrajeController {
  constructor(private readonly service: KilometrajeService) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO, RolUsuario.CONDUCTOR)
  @Get()
  historialConductor(@Param('conductorId', ParseIntPipe) conductorId: number) {
    return this.service.historialConductor(conductorId);
  }

  // GET /conductores/:conductorId/kilometraje/pendientes
  @Roles(RolUsuario.CONDUCTOR, RolUsuario.ADMINISTRADOR)
  @Get('pendientes')
  turnosPendientes(@Param('conductorId', ParseIntPipe) conductorId: number) {
    return this.service.turnosPendientes(conductorId);
  }

  // POST /conductores/:conductorId/kilometraje/pendientes/:registroInicioId/cerrar
  @Roles(RolUsuario.CONDUCTOR, RolUsuario.ADMINISTRADOR)
  @Post('pendientes/:registroInicioId/cerrar')
  cerrarPendiente(
    @Param('conductorId', ParseIntPipe) conductorId: number,
    @Param('registroInicioId', ParseIntPipe) registroInicioId: number,
    @Body() dto: CerrarPendienteDto,
    @Request() req,
  ) {
    if (req.user.rol === RolUsuario.CONDUCTOR && req.user.id !== conductorId) {
      throw new ForbiddenException('Solo puedes cerrar tus propios turnos');
    }
    return this.service.cerrarTurnoPendiente(
      conductorId,
      registroInicioId,
      dto,
    );
  }
}
