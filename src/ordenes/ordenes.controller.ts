import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import {
  CreateOrdenDto,
  UpdateEstadoDto,
  UpdateCostosDto,
  RepuestoDto,
} from './dto/create-orden.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly service: OrdenesService) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Post()
  crear(@Body() dto: CreateOrdenDto) {
    return this.service.crear(dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get()
  listar(@Query('vehiculoId') vehiculoId?: string) {
    return this.service.listar(vehiculoId ? +vehiculoId : undefined);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @Request() req,
  ) {
    return this.service.cambiarEstado(id, dto, req.user.rol);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Patch(':id/costos')
  actualizarCostos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCostosDto,
  ) {
    return this.service.actualizarCostos(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminar(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Post(':id/repuestos')
  agregarRepuestos(
    @Param('id', ParseIntPipe) id: number,
    @Body() repuestos: RepuestoDto[],
  ) {
    return this.service.agregarRepuestos(id, repuestos);
  }
}
