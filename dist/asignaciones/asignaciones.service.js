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
exports.AsignacionesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const asignacion_conductor_entity_1 = require("./asignacion_conductor.entity");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
let AsignacionesService = class AsignacionesService {
    repo;
    docRepo;
    vehiculoRepo;
    planRepo;
    constructor(repo, docRepo, vehiculoRepo, planRepo) {
        this.repo = repo;
        this.docRepo = docRepo;
        this.vehiculoRepo = vehiculoRepo;
        this.planRepo = planRepo;
    }
    async validarVehiculoParaAsignar(vehiculoId) {
        const vehiculo = await this.vehiculoRepo.findOne({ where: { id: vehiculoId } });
        if (!vehiculo) {
            throw new common_1.NotFoundException(`El vehículo #${vehiculoId} no existe`);
        }
        if (vehiculo.estadoSemaforo === 'rojo') {
            throw new common_1.BadRequestException(`El vehículo ${vehiculo.placa} no puede ser asignado: el semáforo está en ROJO.`);
        }
        const planEnRojo = await this.planRepo.findOne({
            where: { vehiculo: { id: vehiculoId }, activo: true, colorUrgencia: 'rojo' },
        });
        if (planEnRojo) {
            throw new common_1.BadRequestException(`El vehículo ${vehiculo.placa} no puede ser asignado: tiene el plan de mantenimiento "${planEnRojo.nombre}" en ROJO.`);
        }
    }
    async crear(dto) {
        const fIni = dto.fechaInicio;
        const fFin = dto.fechaFin || dto.fechaInicio;
        await this.validarVehiculoParaAsignar(dto.vehiculoId);
        const solapadas = await this.repo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.conductor', 'c')
            .leftJoinAndSelect('a.vehiculo', 'v')
            .where('a.activo = true')
            .andWhere(new typeorm_2.Brackets((qb) => {
            qb.where('v.id = :vid', { vid: dto.vehiculoId }).orWhere('c.id = :cid', { cid: dto.conductorId });
        }))
            .andWhere('(a.fechaInicio <= :fFin AND (a.fechaFin >= :fIni OR a.fechaFin IS NULL))', { fIni, fFin })
            .getMany();
        for (const a of solapadas) {
            if (Number(a.vehiculo.id) === Number(dto.vehiculoId)) {
                if (a.turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                    dto.turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                    a.turno === dto.turno) {
                    throw new common_1.BadRequestException(`Conflicto de vehículo: ${a.vehiculo.placa} ya tiene un turno (${a.turno}) que interfiere con el nuevo (${dto.turno}).`);
                }
            }
            if (Number(a.conductor.id) === Number(dto.conductorId)) {
                if (a.turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                    dto.turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                    a.turno === dto.turno) {
                    throw new common_1.BadRequestException(`Conflicto de conductor: El conductor ya tiene una asignación (${a.turno} en ${a.vehiculo.placa}) en este periodo.`);
                }
            }
        }
        const hoy = new Date().toISOString().split('T')[0];
        const docsVencidos = await this.docRepo
            .createQueryBuilder('d')
            .where('d.vehiculo_id = :vid', { vid: dto.vehiculoId })
            .andWhere('d.fecha_vencimiento < :hoy', { hoy })
            .getMany();
        if (docsVencidos.length > 0) {
            const nombres = docsVencidos.map(d => `${d.tipo} (venció ${d.fechaVencimiento})`).join(', ');
            throw new common_1.BadRequestException(`El vehículo no puede ser asignado: tiene documentos vencidos → ${nombres}`);
        }
        const asignacion = this.repo.create({
            vehiculo: { id: dto.vehiculoId },
            conductor: { id: dto.conductorId },
            turno: dto.turno,
            fechaInicio: dto.fechaInicio,
            fechaFin: dto.fechaFin ?? null,
            observaciones: dto.observaciones ?? null,
            activo: true,
        });
        return this.repo.save(asignacion);
    }
    async listarActivas() {
        return this.repo.find({
            relations: ['vehiculo', 'conductor'],
            order: { createdAt: 'DESC' },
        });
    }
    async porVehiculo(vehiculoId) {
        await this.buscarPorId(vehiculoId).catch(() => { });
        return this.repo.find({
            where: { vehiculo: { id: vehiculoId }, activo: true },
            relations: ['conductor'],
            order: { fechaInicio: 'DESC' },
        });
    }
    async porConductor(conductorId) {
        const hoy = new Date().toISOString().split('T')[0];
        return this.repo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.vehiculo', 'v')
            .where('a.conductor_id = :cid', { cid: conductorId })
            .andWhere('a.activo = true')
            .andWhere('a.fecha_inicio <= :hoy', { hoy })
            .andWhere('(a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)', { hoy })
            .orderBy('a.created_at', 'DESC')
            .getMany();
    }
    async desactivar(id) {
        const asig = await this.repo.findOne({ where: { id } });
        if (!asig)
            throw new common_1.NotFoundException(`Asignación #${id} no encontrada`);
        asig.activo = false;
        asig.fechaFin = asig.fechaFin ?? new Date().toISOString().split('T')[0];
        return this.repo.save(asig);
    }
    async historialVehiculo(vehiculoId) {
        return this.repo.find({
            where: { vehiculo: { id: vehiculoId } },
            relations: ['conductor'],
            order: { fechaInicio: 'DESC' },
        });
    }
    async buscarPorId(id) {
        const asig = await this.repo.findOne({
            where: { id },
            relations: ['vehiculo', 'conductor'],
        });
        if (!asig)
            throw new common_1.NotFoundException(`Asignación #${id} no encontrada`);
        return asig;
    }
    async actualizar(id, dto) {
        const asig = await this.buscarPorId(id);
        const vehiculoId = dto.vehiculoId !== undefined ? dto.vehiculoId : asig.vehiculo?.id;
        const conductorId = dto.conductorId !== undefined ? dto.conductorId : asig.conductor?.id;
        const turno = dto.turno !== undefined ? dto.turno : asig.turno;
        const fechaInicio = dto.fechaInicio !== undefined ? dto.fechaInicio : asig.fechaInicio;
        const fechaFin = dto.fechaFin !== undefined ? dto.fechaFin : asig.fechaFin;
        const activo = dto.activo !== undefined ? dto.activo : asig.activo;
        if (activo) {
            if (vehiculoId) {
                await this.validarVehiculoParaAsignar(vehiculoId);
            }
            const fIni = fechaInicio;
            const fFin = fechaFin || fechaInicio;
            const solapadas = await this.repo
                .createQueryBuilder('a')
                .leftJoinAndSelect('a.conductor', 'c')
                .leftJoinAndSelect('a.vehiculo', 'v')
                .where('a.activo = true')
                .andWhere('a.id != :id', { id })
                .andWhere(new typeorm_2.Brackets((qb) => {
                qb.where('v.id = :vid', { vid: vehiculoId }).orWhere('c.id = :cid', { cid: conductorId });
            }))
                .andWhere('(a.fechaInicio <= :fFin AND (a.fechaFin >= :fIni OR a.fechaFin IS NULL))', { fIni, fFin })
                .getMany();
            for (const a of solapadas) {
                if (Number(a.vehiculo.id) === Number(vehiculoId)) {
                    if (a.turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                        turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                        a.turno === turno) {
                        throw new common_1.BadRequestException(`Conflicto de vehículo: ${a.vehiculo.placa} ya tiene un turno (${a.turno}) que interfiere con el nuevo (${turno}).`);
                    }
                }
                if (Number(a.conductor.id) === Number(conductorId)) {
                    if (a.turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                        turno === asignacion_conductor_entity_1.TurnoAsignacion.COMPLETO ||
                        a.turno === turno) {
                        throw new common_1.BadRequestException(`Conflicto de conductor: El conductor ya tiene una asignación (${a.turno} en ${a.vehiculo.placa}) en este periodo.`);
                    }
                }
            }
        }
        if (dto.vehiculoId !== undefined) {
            asig.vehiculo = { id: dto.vehiculoId };
        }
        if (dto.conductorId !== undefined) {
            asig.conductor = { id: dto.conductorId };
        }
        if (dto.turno !== undefined)
            asig.turno = dto.turno;
        if (dto.fechaInicio !== undefined)
            asig.fechaInicio = dto.fechaInicio;
        if (dto.fechaFin !== undefined)
            asig.fechaFin = dto.fechaFin || null;
        if (dto.observaciones !== undefined)
            asig.observaciones = dto.observaciones || null;
        if (dto.activo !== undefined)
            asig.activo = dto.activo;
        await this.repo.save(asig);
        return this.buscarPorId(id);
    }
    async todasPorConductor(conductorId) {
        return this.repo.find({
            where: { conductor: { id: conductorId } },
            relations: ['vehiculo', 'conductor'],
            order: { fechaInicio: 'DESC', createdAt: 'DESC' },
        });
    }
};
exports.AsignacionesService = AsignacionesService;
exports.AsignacionesService = AsignacionesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(asignacion_conductor_entity_1.AsignacionConductor)),
    __param(1, (0, typeorm_1.InjectRepository)(documento_legal_entity_1.DocumentoLegal)),
    __param(2, (0, typeorm_1.InjectRepository)(vehiculo_entity_1.Vehiculo)),
    __param(3, (0, typeorm_1.InjectRepository)(plan_mantenimiento_entity_1.PlanMantenimiento)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AsignacionesService);
//# sourceMappingURL=asignaciones.service.js.map