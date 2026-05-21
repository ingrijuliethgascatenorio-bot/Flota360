import {
  Controller, Get, Post, Patch, Body,
  Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehiculos/:vehiculoId/documentos')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post()
  crear(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Body() dto: CreateDocumentoDto,
  ) {
    return this.service.crear(vehiculoId, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get()
  listar(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    return this.service.listarPorVehiculo(vehiculoId);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch(':tipo')
  actualizar(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Param('tipo') tipo: string,
    @Body() dto: Partial<CreateDocumentoDto>,
  ) {
    return this.service.actualizar(vehiculoId, tipo, dto);
  }
}
