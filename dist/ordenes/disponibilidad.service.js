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
exports.DisponibilidadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
const asignacion_conductor_entity_1 = require("../asignaciones/asignacion_conductor.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
const orden_trabajo_entity_1 = require("./orden-trabajo.entity");
let DisponibilidadService = class DisponibilidadService {
    docRepo;
    asignacionRepo;
    planRepo;
    ordenRepo;
    constructor(docRepo, asignacionRepo, planRepo, ordenRepo) {
        this.docRepo = docRepo;
        this.asignacionRepo = asignacionRepo;
        this.planRepo = planRepo;
        this.ordenRepo = ordenRepo;
    }
    async validarDocumentos(vehiculoId, fecha) {
        const hoy = new Date().toISOString().split('T')[0];
        const docs = await this.docRepo.find({
            where: { vehiculo: { id: vehiculoId } },
        });
        const soat = docs.find((d) => d.tipo === 'SOAT');
        const rtm = docs.find((d) => d.tipo === 'RevisionTM');
        const errors = [];
        if (soat) {
            if (soat.vencido || soat.fechaVencimiento < hoy) {
                errors.push('El vehículo no puede ser programado porque tiene el SOAT vencido.');
            }
            else if (soat.fechaVencimiento < fecha) {
                errors.push('El vehículo no puede ser programado porque el SOAT estará vencido para la fecha solicitada.');
            }
        }
        if (rtm) {
            if (rtm.vencido || rtm.fechaVencimiento < hoy) {
                errors.push('El vehículo no puede ser programado porque tiene la RTM vencida.');
            }
            else if (rtm.fechaVencimiento < fecha) {
                errors.push('El vehículo no puede ser programado porque la RTM estará vencida para la fecha solicitada.');
            }
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException(errors.join(' '));
        }
    }
    async validarPlanPreventivo(vehiculoId, planId) {
        if (!planId) {
            throw new common_1.BadRequestException('Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.');
        }
        const plan = await this.planRepo.findOne({
            where: { id: planId },
            relations: ['vehiculo'],
        });
        if (!plan || !plan.activo || plan.vehiculo.id !== vehiculoId) {
            throw new common_1.BadRequestException('Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.');
        }
        const otPendiente = await this.ordenRepo.findOne({
            where: {
                plan: { id: planId },
                estado: (0, typeorm_2.In)([orden_trabajo_entity_1.EstadoOrden.ABIERTA, orden_trabajo_entity_1.EstadoOrden.EN_PROCESO]),
            },
        });
        if (otPendiente) {
            throw new common_1.BadRequestException('El plan de mantenimiento seleccionado ya tiene una orden de trabajo pendiente.');
        }
    }
    async tieneTurno(vehiculoId, fecha) {
        const asignacion = await this.asignacionRepo.createQueryBuilder('a')
            .where('a.vehiculo_id = :vehiculoId', { vehiculoId })
            .andWhere('a.activo = true')
            .andWhere('a.fecha_inicio <= :fecha', { fecha })
            .andWhere('(a.fecha_fin >= :fecha OR a.fecha_fin IS NULL)', { fecha })
            .getOne();
        return !!asignacion;
    }
    async existeOTIncompatible(vehiculoId, fecha) {
        const count = await this.ordenRepo.count({
            where: {
                vehiculo: { id: vehiculoId },
                fechaOrden: fecha,
                estado: (0, typeorm_2.In)([orden_trabajo_entity_1.EstadoOrden.ABIERTA, orden_trabajo_entity_1.EstadoOrden.EN_PROCESO]),
            },
        });
        return count > 0;
    }
    async buscarFechaDisponible(vehiculoId, planId, tipoMantenimiento, fechaInicial) {
        let fecha = fechaInicial;
        let reprogramada = false;
        let motivo = null;
        const limit = 30;
        let daysAdded = 0;
        if (tipoMantenimiento === orden_trabajo_entity_1.TipoMantenimiento.CORRECTIVO) {
            await this.validarDocumentos(vehiculoId, fecha);
            return { fecha, reprogramada: false, motivo: null };
        }
        while (daysAdded < limit) {
            await this.validarDocumentos(vehiculoId, fecha);
            const turno = await this.tieneTurno(vehiculoId, fecha);
            const otIncompatible = await this.existeOTIncompatible(vehiculoId, fecha);
            if (!turno && !otIncompatible) {
                return { fecha, reprogramada, motivo };
            }
            reprogramada = true;
            if (turno) {
                motivo = 'VEHICULO_CON_TURNO';
            }
            else {
                motivo = 'OT_INCOMPATIBLE';
            }
            const dateObj = new Date(fecha + 'T12:00:00');
            dateObj.setDate(dateObj.getDate() + 1);
            fecha = dateObj.toISOString().split('T')[0];
            daysAdded++;
        }
        throw new common_1.BadRequestException('No se encontró una fecha disponible dentro del límite de 30 días.');
    }
};
exports.DisponibilidadService = DisponibilidadService;
exports.DisponibilidadService = DisponibilidadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(documento_legal_entity_1.DocumentoLegal)),
    __param(1, (0, typeorm_1.InjectRepository)(asignacion_conductor_entity_1.AsignacionConductor)),
    __param(2, (0, typeorm_1.InjectRepository)(plan_mantenimiento_entity_1.PlanMantenimiento)),
    __param(3, (0, typeorm_1.InjectRepository)(orden_trabajo_entity_1.OrdenTrabajo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DisponibilidadService);
//# sourceMappingURL=disponibilidad.service.js.map