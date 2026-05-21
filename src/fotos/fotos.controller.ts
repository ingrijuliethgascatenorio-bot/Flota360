import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as crypto from 'crypto';
import * as path from 'path';

import { FotosService } from './fotos.service';
import { SubirFotosDto } from './dto/subir-fotos.dto';
import { TipoFoto } from './foto-orden.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';

// Raíz absoluta del proyecto (donde está package.json)
// process.cwd() siempre apunta al directorio desde donde se lanzó `node`,
// que es la raíz del proyecto, independiente de si el código está en dist/ o src/
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.join(UPLOADS_ROOT, 'temp');
    import('fs')
      .then((fs) => {
        fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
      })
      .catch((err) => cb(err, ''));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomBytes(12).toString('hex');
    cb(null, `${uniqueId}${ext}`);
  },
});

const multerFilter = (
  _req: any,
  file: any,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  const permitidos = ['image/jpeg', 'image/png'];
  cb(null, permitidos.includes(file.mimetype as string));
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class FotosController {
  constructor(private readonly fotosService: FotosService) {}

  // POST /ordenes/:ordenId/fotos
  @Roles(RolUsuario.TECNICO, RolUsuario.ADMINISTRADOR)
  @Post('ordenes/:ordenId/fotos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: multerStorage,
      fileFilter: multerFilter,
      limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    }),
  )
  async adjuntarFotos(
    @Param('ordenId', ParseIntPipe) ordenId: number,
    @Body() dto: SubirFotosDto,
    @UploadedFiles() archivos: Express.Multer.File[],
    @Request() req,
  ) {
    if (!archivos || archivos.length === 0) {
      throw new BadRequestException('Debe adjuntar al menos un archivo.');
    }

    const fotos = await this.fotosService.adjuntarFotos(
      ordenId,
      archivos.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
      })),
      dto.tipoFoto as TipoFoto,
      req.user.id,
    );

    return {
      message: `${fotos.length} foto(s) adjuntada(s) correctamente.`,
      data: fotos,
    };
  }

  // GET /ordenes/:ordenId/fotos
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get('ordenes/:ordenId/fotos')
  async listarFotosPorOrden(@Param('ordenId', ParseIntPipe) ordenId: number) {
    const galeria = await this.fotosService.listarPorOrden(ordenId);
    return { data: galeria };
  }

  // DELETE /ordenes/:ordenId/fotos/:fotoId
  @Roles(RolUsuario.TECNICO, RolUsuario.ADMINISTRADOR)
  @Delete('ordenes/:ordenId/fotos/:fotoId')
  async eliminarFoto(
    @Param('ordenId', ParseIntPipe) ordenId: number,
    @Param('fotoId', ParseIntPipe) fotoId: number,
  ) {
    const resultado = await this.fotosService.eliminar(fotoId, ordenId);
    return { message: 'Foto eliminada.', data: resultado };
  }

  // GET /vehiculos/:vehiculoId/historial-fotos
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.TECNICO)
  @Get('vehiculos/:vehiculoId/historial-fotos')
  async historialFotosPorVehiculo(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
  ) {
    const historial = await this.fotosService.historialPorVehiculo(vehiculoId);
    return { data: historial, total_ordenes: historial.length };
  }
}
