import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';

import { FotoOrden, TipoFoto } from './foto-orden.entity';
import { OrdenTrabajo, EstadoOrden } from '../ordenes/orden-trabajo.entity';

const MAX_FOTOS = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB
const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png']);
const EXT_PERMITIDAS = new Set(['.jpg', '.jpeg', '.png']);

export interface ArchivoMulter {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface GaleriaOrden {
  antes: FotoOrden[];
  despues: FotoOrden[];
  total: number;
}

export interface GrupoFotosVehiculo {
  ordenId: number;
  fechaApertura: string;
  estado: EstadoOrden;
  tecnico: string;
  antes: Partial<FotoOrden>[];
  despues: Partial<FotoOrden>[];
}

@Injectable()
export class FotosService {
  constructor(
    @InjectRepository(FotoOrden)
    private readonly fotoRepo: Repository<FotoOrden>,

    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepo: Repository<OrdenTrabajo>,

    private readonly dataSource: DataSource,
  ) {}

  // ─── RF-07: Adjuntar fotos a una orden ─────────────────────────────────────

  async adjuntarFotos(
    ordenId: number,
    archivos: ArchivoMulter[],
    tipoFoto: TipoFoto,
    usuarioId: number,
  ): Promise<FotoOrden[]> {
    // 1. Validar que la orden exista y no esté cerrada
    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) {
      await this.limpiarArchivos(archivos);
      throw new NotFoundException(`Orden #${ordenId} no encontrada`);
    }
    if (orden.estado === EstadoOrden.CERRADA) {
      await this.limpiarArchivos(archivos);
      throw new ConflictException(
        'No se pueden adjuntar fotos a una orden cerrada',
      );
    }

    // 2. Validar cantidad total de fotos
    const totalExistentes = await this.fotoRepo.count({
      where: { orden: { id: ordenId } },
    });
    if (totalExistentes + archivos.length > MAX_FOTOS) {
      await this.limpiarArchivos(archivos);
      throw new UnprocessableEntityException(
        `La orden ya tiene ${totalExistentes} foto(s). Solo puede agregar ${MAX_FOTOS - totalExistentes} más (máx ${MAX_FOTOS}).`,
      );
    }

    // 3. Validar peso total (10 MB por OT)
    const bytesExistentes = await this.fotoRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.tamanoBytes), 0)', 'total')
      .where('f.orden.id = :ordenId', { ordenId })
      .getRawOne<{ total: string }>()
      .then((r) => Number(r?.total ?? 0));

    const bytesNuevos = archivos.reduce((acc, f) => acc + f.size, 0);
    if (bytesExistentes + bytesNuevos > MAX_TOTAL_BYTES) {
      await this.limpiarArchivos(archivos);
      throw new UnprocessableEntityException(
        `El límite de ${MAX_TOTAL_BYTES / (1024 * 1024)} MB por orden sería superado.`,
      );
    }

    // 4. Validar MIME y extensión de cada archivo
    for (const archivo of archivos) {
      const ext = path.extname(archivo.originalname).toLowerCase();
      if (!MIME_PERMITIDOS.has(archivo.mimetype) || !EXT_PERMITIDAS.has(ext)) {
        await this.limpiarArchivos(archivos);
        throw new UnprocessableEntityException(
          `Tipo de archivo no permitido: ${archivo.originalname}. Solo JPG y PNG.`,
        );
      }
    }

    // 5. Mover archivos de temp → carpeta permanente con ruta ABSOLUTA
    //    ServeStatic sirve desde: process.cwd()/uploads → URL /uploads/...
    //    Se usa process.cwd() para anclar independiente de dist/ o src/
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const dirDestino = path.join(uploadsRoot, 'ordenes', String(ordenId));
    await fs.mkdir(dirDestino, { recursive: true });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fotosInsertadas: FotoOrden[] = [];

      for (const archivo of archivos) {
        const nombreFinal = path.basename(archivo.path);
        const rutaFinal = path.join(dirDestino, nombreFinal);

        // Mover de temp → permanente
        await fs.rename(archivo.path, rutaFinal).catch(async () => {
          await fs.copyFile(archivo.path, rutaFinal);
          await fs.unlink(archivo.path).catch(() => {});
        });

        // URL que el frontend construirá como:
        // apiAssetUrl("uploads/ordenes/5/abc.jpg")
        // → http://localhost:3002/uploads/ordenes/5/abc.jpg  ✓
        const urlRelativa = `uploads/ordenes/${ordenId}/${nombreFinal}`;

        const foto = queryRunner.manager.create(FotoOrden, {
          orden: { id: ordenId } as OrdenTrabajo,
          url: urlRelativa,
          tipoFoto,
          tamanoBytes: archivo.size,
          subidaPor: { id: usuarioId } as any,
        });
        const guardada = await queryRunner.manager.save(FotoOrden, foto);
        fotosInsertadas.push(guardada);
      }

      await queryRunner.commitTransaction();
      return fotosInsertadas;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await this.limpiarArchivos(archivos);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── RF-07: Listar fotos de una orden agrupadas por tipo ───────────────────

  async listarPorOrden(ordenId: number): Promise<GaleriaOrden> {
    const fotos = await this.fotoRepo.find({
      where: { orden: { id: ordenId } },
      relations: ['subidaPor'],
      order: { tipoFoto: 'ASC', tomadaEn: 'ASC' },
    });

    return {
      antes: fotos.filter((f) => f.tipoFoto === TipoFoto.ANTES),
      despues: fotos.filter((f) => f.tipoFoto === TipoFoto.DESPUES),
      total: fotos.length,
    };
  }

  // ─── RF-07: Historial de fotos de un vehículo agrupado por orden ───────────

  async historialPorVehiculo(
    vehiculoId: number,
  ): Promise<GrupoFotosVehiculo[]> {
    const fotos = await this.fotoRepo
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.orden', 'ot')
      .leftJoin('ot.tecnico', 'u')
      .addSelect(['u.nombre'])
      .where('ot.vehiculo.id = :vehiculoId', { vehiculoId })
      .orderBy('ot.fechaApertura', 'DESC')
      .addOrderBy('f.tipoFoto', 'ASC')
      .addOrderBy('f.tomadaEn', 'ASC')
      .getMany();

    // Agrupar por ordenId
    const mapa = new Map<number, GrupoFotosVehiculo>();

    for (const foto of fotos) {
      const oId = foto.orden.id;
      if (!mapa.has(oId)) {
        mapa.set(oId, {
          ordenId: oId,
          fechaApertura: (foto.orden as any).fechaApertura,
          estado: (foto.orden as any).estado,
          tecnico: (foto.orden as any).tecnico?.nombre ?? '',
          antes: [],
          despues: [],
        });
      }
      const grupo = mapa.get(oId)!;
      const item = {
        id: foto.id,
        url: foto.url,
        tomadaEn: foto.tomadaEn,
        tamanoBytes: foto.tamanoBytes,
      };
      if (foto.tipoFoto === TipoFoto.ANTES) grupo.antes.push(item);
      else grupo.despues.push(item);
    }

    return Array.from(mapa.values());
  }

  // ─── RF-07: Eliminar foto (solo si la orden no está cerrada) ───────────────

  async eliminar(
    fotoId: number,
    ordenId: number,
  ): Promise<{ eliminado: boolean; fotoId: number }> {
    const foto = await this.fotoRepo
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.orden', 'ot')
      .where('f.id = :fotoId AND ot.id = :ordenId', { fotoId, ordenId })
      .getOne();

    if (!foto) throw new NotFoundException('Foto no encontrada');

    if ((foto.orden as any).estado === EstadoOrden.CERRADA) {
      throw new ConflictException(
        'No se pueden eliminar fotos de una orden cerrada',
      );
    }

    await this.fotoRepo.remove(foto);

    // Borrar archivo físico con ruta absoluta
    const rutaAbsoluta = path.join(process.cwd(), foto.url);
    await fs.unlink(rutaAbsoluta).catch(() => {});

    return { eliminado: true, fotoId };
  }

  // ─── Helper privado ────────────────────────────────────────────────────────

  private async limpiarArchivos(archivos: ArchivoMulter[]): Promise<void> {
    await Promise.allSettled(
      archivos.map((a) => fs.unlink(a.path).catch(() => {})),
    );
  }
}
