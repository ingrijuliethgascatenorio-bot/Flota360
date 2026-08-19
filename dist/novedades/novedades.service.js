"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovedadesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const novedad_entity_1 = require("./entities/novedad.entity");
const estado_novedad_enum_1 = require("./enums/estado-novedad.enum");
const asignaciones_service_1 = require("../asignaciones/asignaciones.service");
const ordenes_service_1 = require("../ordenes/ordenes.service");
const orden_trabajo_entity_1 = require("../ordenes/orden-trabajo.entity");
let NovedadesService = class NovedadesService {
    repo;
    asignacionesService;
    ordenesService;
    constructor(repo, asignacionesService, ordenesService) {
        this.repo = repo;
        this.asignacionesService = asignacionesService;
        this.ordenesService = ordenesService;
    }
    async crear(conductorId, dto) {
        const asignaciones = await this.asignacionesService.porConductor(conductorId);
        if (!asignaciones.length) {
            throw new common_1.UnprocessableEntityException('No tienes vehículos asignados para el día de hoy. ' +
                'No es posible reportar una novedad sin una asignación activa.');
        }
        const asignacionActiva = asignaciones[0];
        const vehiculoId = asignacionActiva.vehiculo.id;
        const novedad = this.repo.create({
            vehiculo: { id: vehiculoId },
            conductor: { id: conductorId },
            tipoNovedad: dto.tipoNovedad,
            descripcion: dto.descripcion,
            estado: estado_novedad_enum_1.EstadoNovedad.PENDIENTE,
        });
        return this.repo.save(novedad);
    }
    async misNovedades(conductorId) {
        return this.repo.find({
            where: { conductor: { id: conductorId } },
            relations: ['vehiculo', 'ordenTrabajo'],
            order: { fechaReporte: 'DESC' },
        });
    }
    async listar(filtros) {
        const qb = this.repo
            .createQueryBuilder('n')
            .leftJoinAndSelect('n.vehiculo', 'v')
            .leftJoinAndSelect('n.conductor', 'c')
            .leftJoinAndSelect('n.ordenTrabajo', 'ot')
            .orderBy('n.fechaReporte', 'DESC');
        if (filtros.estado) {
            qb.andWhere('n.estado = :estado', { estado: filtros.estado });
        }
        if (filtros.vehiculoId) {
            qb.andWhere('v.id = :vid', { vid: filtros.vehiculoId });
        }
        if (filtros.desde) {
            qb.andWhere('n.fechaReporte >= :desde', { desde: filtros.desde });
        }
        if (filtros.hasta) {
            qb.andWhere("n.fechaReporte < :hasta::date + INTERVAL '1 day'", {
                hasta: filtros.hasta,
            });
        }
        return qb.getMany();
    }
    async buscarPorId(id) {
        const novedad = await this.repo.findOne({
            where: { id },
            relations: ['vehiculo', 'conductor', 'ordenTrabajo'],
        });
        if (!novedad)
            throw new common_1.NotFoundException(`Novedad #${id} no encontrada`);
        return novedad;
    }
    async aprobar(id, dto) {
        const novedad = await this.buscarPorId(id);
        if (novedad.estado !== estado_novedad_enum_1.EstadoNovedad.PENDIENTE) {
            throw new common_1.BadRequestException(`La novedad #${id} ya fue procesada (estado: ${novedad.estado}). ` +
                'Solo se pueden aprobar novedades en estado Pendiente.');
        }
        const descripcionOT = this.generarDescripcionOT(novedad);
        const hoy = new Date().toISOString().split('T')[0];
        const orden = await this.ordenesService.crear({
            vehiculoId: novedad.vehiculo.id,
            tecnicoId: dto.tecnicoId,
            descripcion: descripcionOT,
            costoManoObra: 0,
            tipoMantenimiento: orden_trabajo_entity_1.TipoMantenimiento.CORRECTIVO,
            fechaOrden: hoy,
            planId: undefined,
        });
        novedad.estado = estado_novedad_enum_1.EstadoNovedad.APROBADA;
        novedad.observacionAdmin = dto.observacion ?? null;
        novedad.ordenTrabajo = orden;
        return this.repo.save(novedad);
    }
    async rechazar(id, dto) {
        const novedad = await this.buscarPorId(id);
        if (novedad.estado !== estado_novedad_enum_1.EstadoNovedad.PENDIENTE) {
            throw new common_1.BadRequestException(`La novedad #${id} ya fue procesada (estado: ${novedad.estado}).`);
        }
        novedad.estado = estado_novedad_enum_1.EstadoNovedad.RECHAZADA;
        novedad.observacionAdmin = dto.observacion ?? null;
        return this.repo.save(novedad);
    }
    generarDescripcionOT(novedad) {
        return (`Orden creada automáticamente desde la novedad #${novedad.id}.\n` +
            `Vehículo: ${novedad.vehiculo.placa}\n` +
            `Tipo de novedad: ${novedad.tipoNovedad}\n` +
            `Descripción reportada:\n${novedad.descripcion}`);
    }
};
exports.NovedadesService = NovedadesService;
exports.NovedadesService = NovedadesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(novedad_entity_1.Novedad)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        asignaciones_service_1.AsignacionesService,
        ordenes_service_1.OrdenesService])
], NovedadesService);
//# sourceMappingURL=novedades.service.js.map