import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NovedadesService } from './novedades.service';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { AprobarNovedadDto, RechazarNovedadDto, FiltrarNovedadesDto } from './dto/aprobar-novedad.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('novedades')
export class NovedadesController {
  constructor(private readonly service: NovedadesService) {}

  // ─── CONDUCTOR ────────────────────────────────────────────────────────────

  /**
   * POST /novedades
   * El conductor reporta una novedad.
   * El vehiculoId se resuelve automáticamente desde su asignación activa.
   * Body: { tipoNovedad, descripcion }
   */
  @Roles(RolUsuario.CONDUCTOR)
  @Post()
  crear(@Request() req, @Body() dto: CreateNovedadDto) {
    return this.service.crear(req.user.id, dto);
  }

  /**
   * GET /novedades/mias
   * El conductor consulta sus propias novedades.
   */
  @Roles(RolUsuario.CONDUCTOR)
  @Get('mias')
  misNovedades(@Request() req) {
    return this.service.misNovedades(req.user.id);
  }

  // ─── ADMINISTRADOR ────────────────────────────────────────────────────────

  /**
   * GET /novedades
   * Lista todas las novedades con filtros opcionales.
   * Query params: estado, vehiculoId, desde, hasta
   */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get()
  listar(@Query() filtros: FiltrarNovedadesDto) {
    return this.service.listar(filtros);
  }

  /**
   * GET /novedades/:id
   * Detalle de una novedad.
   */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  /**
   * PATCH /novedades/:id/aprobar
   * El admin aprueba la novedad y selecciona un técnico.
   * Se genera automáticamente una Orden de Trabajo.
   * Body: { tecnicoId, observacion? }
   */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch(':id/aprobar')
  aprobar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarNovedadDto,
  ) {
    return this.service.aprobar(id, dto);
  }

  /**
   * PATCH /novedades/:id/rechazar
   * El admin rechaza la novedad.
   * Body: { observacion? }
   */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch(':id/rechazar')
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarNovedadDto,
  ) {
    return this.service.rechazar(id, dto);
  }
}
