"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FotosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const foto_orden_entity_1 = require("./foto-orden.entity");
const orden_trabajo_entity_1 = require("../ordenes/orden-trabajo.entity");
const MAX_FOTOS = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png']);
const EXT_PERMITIDAS = new Set(['.jpg', '.jpeg', '.png']);
let FotosService = class FotosService {
    fotoRepo;
    ordenRepo;
    dataSource;
    constructor(fotoRepo, ordenRepo, dataSource) {
        this.fotoRepo = fotoRepo;
        this.ordenRepo = ordenRepo;
        this.dataSource = dataSource;
    }
    async adjuntarFotos(ordenId, archivos, tipoFoto, usuarioId) {
        const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
        if (!orden) {
            await this.limpiarArchivos(archivos);
            throw new common_1.NotFoundException(`Orden #${ordenId} no encontrada`);
        }
        if (orden.estado === orden_trabajo_entity_1.EstadoOrden.CERRADA) {
            await this.limpiarArchivos(archivos);
            throw new common_1.ConflictException('No se pueden adjuntar fotos a una orden cerrada');
        }
        const totalExistentes = await this.fotoRepo.count({
            where: { orden: { id: ordenId } },
        });
        if (totalExistentes + archivos.length > MAX_FOTOS) {
            await this.limpiarArchivos(archivos);
            throw new common_1.UnprocessableEntityException(`La orden ya tiene ${totalExistentes} foto(s). Solo puede agregar ${MAX_FOTOS - totalExistentes} más (máx ${MAX_FOTOS}).`);
        }
        const bytesExistentes = await this.fotoRepo
            .createQueryBuilder('f')
            .select('COALESCE(SUM(f.tamanoBytes), 0)', 'total')
            .where('f.orden.id = :ordenId', { ordenId })
            .getRawOne()
            .then((r) => Number(r?.total ?? 0));
        const bytesNuevos = archivos.reduce((acc, f) => acc + f.size, 0);
        if (bytesExistentes + bytesNuevos > MAX_TOTAL_BYTES) {
            await this.limpiarArchivos(archivos);
            throw new common_1.UnprocessableEntityException(`El límite de ${MAX_TOTAL_BYTES / (1024 * 1024)} MB por orden sería superado.`);
        }
        for (const archivo of archivos) {
            const ext = path.extname(archivo.originalname).toLowerCase();
            if (!MIME_PERMITIDOS.has(archivo.mimetype) || !EXT_PERMITIDAS.has(ext)) {
                await this.limpiarArchivos(archivos);
                throw new common_1.UnprocessableEntityException(`Tipo de archivo no permitido: ${archivo.originalname}. Solo JPG y PNG.`);
            }
        }
        const uploadsRoot = path.join(process.cwd(), 'uploads');
        const dirDestino = path.join(uploadsRoot, 'ordenes', String(ordenId));
        await fs.mkdir(dirDestino, { recursive: true });
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const fotosInsertadas = [];
            for (const archivo of archivos) {
                const nombreFinal = path.basename(archivo.path);
                const rutaFinal = path.join(dirDestino, nombreFinal);
                await fs.rename(archivo.path, rutaFinal).catch(async () => {
                    await fs.copyFile(archivo.path, rutaFinal);
                    await fs.unlink(archivo.path).catch(() => { });
                });
                const urlRelativa = `uploads/ordenes/${ordenId}/${nombreFinal}`;
                const foto = queryRunner.manager.create(foto_orden_entity_1.FotoOrden, {
                    orden: { id: ordenId },
                    url: urlRelativa,
                    tipoFoto,
                    tamanoBytes: archivo.size,
                    subidaPor: { id: usuarioId },
                });
                const guardada = await queryRunner.manager.save(foto_orden_entity_1.FotoOrden, foto);
                fotosInsertadas.push(guardada);
            }
            await queryRunner.commitTransaction();
            return fotosInsertadas;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            await this.limpiarArchivos(archivos);
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async listarPorOrden(ordenId) {
        const fotos = await this.fotoRepo.find({
            where: { orden: { id: ordenId } },
            relations: ['subidaPor'],
            order: { tipoFoto: 'ASC', tomadaEn: 'ASC' },
        });
        return {
            antes: fotos.filter((f) => f.tipoFoto === foto_orden_entity_1.TipoFoto.ANTES),
            despues: fotos.filter((f) => f.tipoFoto === foto_orden_entity_1.TipoFoto.DESPUES),
            total: fotos.length,
        };
    }
    async historialPorVehiculo(vehiculoId) {
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
        const mapa = new Map();
        for (const foto of fotos) {
            const oId = foto.orden.id;
            if (!mapa.has(oId)) {
                mapa.set(oId, {
                    ordenId: oId,
                    fechaApertura: foto.orden.fechaApertura,
                    estado: foto.orden.estado,
                    tecnico: foto.orden.tecnico?.nombre ?? '',
                    antes: [],
                    despues: [],
                });
            }
            const grupo = mapa.get(oId);
            const item = {
                id: foto.id,
                url: foto.url,
                tomadaEn: foto.tomadaEn,
                tamanoBytes: foto.tamanoBytes,
            };
            if (foto.tipoFoto === foto_orden_entity_1.TipoFoto.ANTES)
                grupo.antes.push(item);
            else
                grupo.despues.push(item);
        }
        return Array.from(mapa.values());
    }
    async eliminar(fotoId, ordenId) {
        const foto = await this.fotoRepo
            .createQueryBuilder('f')
            .innerJoinAndSelect('f.orden', 'ot')
            .where('f.id = :fotoId AND ot.id = :ordenId', { fotoId, ordenId })
            .getOne();
        if (!foto)
            throw new common_1.NotFoundException('Foto no encontrada');
        if (foto.orden.estado === orden_trabajo_entity_1.EstadoOrden.CERRADA) {
            throw new common_1.ConflictException('No se pueden eliminar fotos de una orden cerrada');
        }
        await this.fotoRepo.remove(foto);
        const rutaAbsoluta = path.join(process.cwd(), foto.url);
        await fs.unlink(rutaAbsoluta).catch(() => { });
        return { eliminado: true, fotoId };
    }
    async limpiarArchivos(archivos) {
        await Promise.allSettled(archivos.map((a) => fs.unlink(a.path).catch(() => { })));
    }
};
exports.FotosService = FotosService;
exports.FotosService = FotosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(foto_orden_entity_1.FotoOrden)),
    __param(1, (0, typeorm_1.InjectRepository)(orden_trabajo_entity_1.OrdenTrabajo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], FotosService);
//# sourceMappingURL=fotos.service.js.map