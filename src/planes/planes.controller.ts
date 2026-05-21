import {
  Controller, Get, Post, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { PlanesService } from './planes.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehiculos/:vehiculoId/planes')
export class PlanesController {
  constructor(private readonly service: PlanesService) {}

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post()
  crear(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Body() dto: CreatePlanDto,
  ) {
    return this.service.crear(vehiculoId, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get()
  listar(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    return this.service.listarPorVehiculo(vehiculoId);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.desactivar(id);
  }
}
