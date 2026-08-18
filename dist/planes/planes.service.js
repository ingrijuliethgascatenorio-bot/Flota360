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
exports.PlanesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_mantenimiento_entity_1 = require("./plan-mantenimiento.entity");
const vehiculos_service_1 = require("../vehiculos/vehiculos.service");
const alerta_entity_1 = require("../alertas/alerta.entity");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
let PlanesService = class PlanesService {
    repo;
    vehiculosService;
    alertaRepo;
    vehiculoRepo;
    constructor(repo, vehiculosService, alertaRepo, vehiculoRepo) {
        this.repo = repo;
        this.vehiculosService = vehiculosService;
        this.alertaRepo = alertaRepo;
        this.vehiculoRepo = vehiculoRepo;
    }
    async crear(vehiculoId, dto) {
        const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);
        if ((dto.tipoCiclo === plan_mantenimiento_entity_1.TipoCiclo.KM || dto.tipoCiclo === plan_mantenimiento_entity_1.TipoCiclo.COMBINADO) &&
            !dto.intervaloKm)
            throw new common_1.BadRequestException('intervaloKm es requerido para este tipo de ciclo');
        if ((dto.tipoCiclo === plan_mantenimiento_entity_1.TipoCiclo.DIAS || dto.tipoCiclo === plan_mantenimiento_entity_1.TipoCiclo.COMBINADO) &&
            !dto.intervaloDias)
            throw new common_1.BadRequestException('intervaloDias es requerido para este tipo de ciclo');
        const hoy = new Date();
        const kmProximo = dto.intervaloKm
            ? vehiculo.kmActual + dto.intervaloKm
            : null;
        let fechaProxima = null;
        if (dto.intervaloDias) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() + dto.intervaloDias);
            fechaProxima = fecha.toISOString().split('T')[0];
        }
        const plan = this.repo.create({
            vehiculo,
            nombre: dto.nombre,
            tipoCiclo: dto.tipoCiclo,
            intervaloKm: dto.intervaloKm ?? null,
            intervaloDias: dto.intervaloDias ?? null,
            kmProximo,
            fechaProxima,
        });
        return this.repo.save(plan);
    }
    async listarPorVehiculo(vehiculoId) {
        await this.vehiculosService.buscarPorId(vehiculoId);
        return this.repo.find({
            where: { vehiculo: { id: vehiculoId }, activo: true },
            order: { createdAt: 'DESC' },
        });
    }
    async buscarPorId(id) {
        const plan = await this.repo.findOne({ where: { id }, relations: ['vehiculo'] });
        if (!plan)
            throw new common_1.NotFoundException(`Plan #${id} no encontrado`);
        return plan;
    }
    async desactivar(id) {
        const plan = await this.buscarPorId(id);
        plan.activo = false;
        await this.repo.save(plan);
    }
    async recalcularPrediccion(vehiculoId, kmPorDia) {
        const planes = await this.repo.find({
            where: { vehiculo: { id: vehiculoId }, activo: true },
            relations: ['vehiculo'],
        });
        const hoy = new Date();
        for (const plan of planes) {
            plan.kmPorDia = kmPorDia;
            if (!kmPorDia || kmPorDia === 0 || !plan.kmProximo || !plan.vehiculo.kmActual) {
                plan.colorUrgencia = kmPorDia === 0 ? 'sin_actividad' : null;
                plan.fechaEstimada = null;
            }
            else {
                const kmRestantes = plan.kmProximo - plan.vehiculo.kmActual;
                const diasEstimados = kmRestantes > 0 ? Math.floor(kmRestantes / kmPorDia) : 0;
                const fechaEst = new Date(hoy);
                fechaEst.setDate(fechaEst.getDate() + diasEstimados);
                plan.fechaEstimada = fechaEst.toISOString().split('T')[0];
                const colorAnterior = plan.colorUrgencia;
                if (diasEstimados > 15)
                    plan.colorUrgencia = 'verde';
                else if (diasEstimados >= 7)
                    plan.colorUrgencia = 'amarillo';
                else
                    plan.colorUrgencia = 'rojo';
                if (colorAnterior && colorAnterior !== plan.colorUrgencia) {
                }
            }
            plan.prediccionActualizadaEn = new Date();
            await this.repo.save(plan);
        }
    }
    async reiniciarCiclo(planId, kmActual) {
        const plan = await this.buscarPorId(planId);
        const hoy = new Date();
        if (plan.intervaloKm) {
            plan.kmProximo = kmActual + plan.intervaloKm;
        }
        if (plan.intervaloDias) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() + plan.intervaloDias);
            plan.fechaProxima = fecha.toISOString().split('T')[0];
        }
        await this.repo.save(plan);
        await this.alertaRepo.update({ plan: { id: planId }, leida: false }, { leida: true });
        if (plan.vehiculo?.id) {
            await this.recalcularSemaforo(plan.vehiculo.id);
        }
    }
    async recalcularSemaforo(vehiculoId) {
        const alertasActivas = await this.alertaRepo.find({
            where: { vehiculo: { id: vehiculoId }, leida: false },
            select: ['tipoAlerta'],
        });
        const tipos = new Set(alertasActivas.map((a) => a.tipoAlerta));
        let semaforo;
        if (tipos.has('mantenimiento_vencido') ||
            tipos.has('documento_vencido') ||
            tipos.has('documento_7dias')) {
            semaforo = 'rojo';
        }
        else if (tipos.has('mantenimiento_proximo') ||
            tipos.has('documento_15dias') ||
            tipos.has('documento_30dias')) {
            semaforo = 'amarillo';
        }
        else {
            semaforo = 'verde';
        }
        await this.vehiculoRepo.update(vehiculoId, { estadoSemaforo: semaforo });
    }
};
exports.PlanesService = PlanesService;
exports.PlanesService = PlanesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_mantenimiento_entity_1.PlanMantenimiento)),
    __param(2, (0, typeorm_1.InjectRepository)(alerta_entity_1.Alerta)),
    __param(3, (0, typeorm_1.InjectRepository)(vehiculo_entity_1.Vehiculo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        vehiculos_service_1.VehiculosService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PlanesService);
//# sourceMappingURL=planes.service.js.map