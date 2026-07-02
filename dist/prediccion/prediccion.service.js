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
var PrediccionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrediccionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const prediccion_vehiculo_entity_1 = require("./prediccion-vehiculo.entity");
const alerta_entity_1 = require("../alertas/alerta.entity");
const MIN_REGISTROS = 2;
const DIAS_LABORABLES = 7;
let PrediccionService = PrediccionService_1 = class PrediccionService {
    prediccionRepo;
    alertaRepo;
    dataSource;
    logger = new common_1.Logger(PrediccionService_1.name);
    constructor(prediccionRepo, alertaRepo, dataSource) {
        this.prediccionRepo = prediccionRepo;
        this.alertaRepo = alertaRepo;
        this.dataSource = dataSource;
    }
    async calcularKmDia(vehiculoId) {
        const registros = await this.dataSource.query(`SELECT km_valor, registrado_en
         FROM registro_km
         WHERE vehiculo_id = $1
           AND registrado_en >= NOW() - INTERVAL '${DIAS_LABORABLES} days'
         ORDER BY registrado_en ASC`, [vehiculoId]);
        if (registros.length < MIN_REGISTROS) {
            return {
                vehiculoId,
                kmPorDia: null,
                registros: registros.length,
                suficiente: false,
                mensaje: 'Datos insuficientes',
            };
        }
        const deltas = [];
        for (let i = 1; i < registros.length; i++) {
            const deltaKm = registros[i].km_valor - registros[i - 1].km_valor;
            const deltaDias = (new Date(registros[i].registrado_en).getTime() -
                new Date(registros[i - 1].registrado_en).getTime()) /
                (1000 * 60 * 60 * 24);
            if (deltaKm < 0 || deltaDias <= 0)
                continue;
            deltas.push({ deltaKm, deltaDias });
        }
        const deltasFiltrados = this.filtrarAnomalias(deltas);
        if (deltasFiltrados.length === 0) {
            return {
                vehiculoId,
                kmPorDia: 0,
                registros: registros.length,
                suficiente: true,
                mensaje: 'Sin actividad reciente',
            };
        }
        const totalKm = deltasFiltrados.reduce((acc, d) => acc + d.deltaKm, 0);
        const totalDias = deltasFiltrados.reduce((acc, d) => acc + d.deltaDias, 0);
        const kmPorDia = totalDias > 0 ? Math.round((totalKm / totalDias) * 100) / 100 : 0;
        return {
            vehiculoId,
            kmPorDia,
            registros: registros.length,
            suficiente: true,
            mensaje: kmPorDia === 0 ? 'Sin actividad reciente' : null,
        };
    }
    async calcularPrediccion(vehiculoId) {
        const kmDiaRes = await this.calcularKmDia(vehiculoId);
        const [vehiculo] = await this.dataSource.query(`SELECT id, placa, km_actual FROM vehiculo WHERE id = $1`, [vehiculoId]);
        const planes = await this.dataSource.query(`SELECT id, nombre, tipo_ciclo, km_proximo, fecha_proxima
       FROM plan_mantenimiento
       WHERE vehiculo_id = $1 AND activo = TRUE`, [vehiculoId]);
        const hoy = new Date();
        const predicciones = [];
        for (const plan of planes) {
            let diasEstimados = null;
            let fechaEstimada = null;
            let kmRestantes = null;
            let color = prediccion_vehiculo_entity_1.ColorUrgencia.GRIS;
            if (['km', 'combinado'].includes(plan.tipo_ciclo) &&
                plan.km_proximo !== null) {
                kmRestantes = plan.km_proximo - vehiculo.km_actual;
                if (kmRestantes <= 0) {
                    diasEstimados = 0;
                    color = prediccion_vehiculo_entity_1.ColorUrgencia.ROJO;
                    fechaEstimada = hoy.toISOString().split('T')[0];
                }
                else if (kmDiaRes.kmPorDia && kmDiaRes.kmPorDia > 0) {
                    diasEstimados = Math.ceil(kmRestantes / kmDiaRes.kmPorDia);
                    const fe = new Date(hoy);
                    fe.setDate(fe.getDate() + diasEstimados);
                    fechaEstimada = fe.toISOString().split('T')[0];
                    color = this.colorPorDias(diasEstimados);
                }
            }
            if (['dias', 'combinado'].includes(plan.tipo_ciclo) &&
                plan.fecha_proxima !== null) {
                const diasFecha = Math.ceil((new Date(plan.fecha_proxima).getTime() - hoy.getTime()) /
                    (1000 * 60 * 60 * 24));
                if (diasEstimados === null || diasFecha < diasEstimados) {
                    diasEstimados = diasFecha;
                    fechaEstimada = diasFecha > 0
                        ? plan.fecha_proxima
                        : plan.fecha_proxima;
                    color = this.colorPorDias(diasFecha);
                }
            }
            predicciones.push({
                planId: plan.id,
                planNombre: plan.nombre,
                kmRestantes,
                diasEstimados,
                fechaEstimada,
                colorUrgencia: color,
            });
        }
        predicciones.sort((a, b) => {
            const orden = { rojo: 0, amarillo: 1, verde: 2, gris: 3 };
            return orden[a.colorUrgencia] - orden[b.colorUrgencia];
        });
        const masUrgente = predicciones[0] ?? null;
        await this.persistirSnapshot(vehiculoId, kmDiaRes, masUrgente);
        await this.generarAlertaSiCambia(vehiculoId, masUrgente);
        return {
            vehiculoId,
            placa: vehiculo.placa,
            kmPorDia: kmDiaRes.kmPorDia,
            suficiente: kmDiaRes.suficiente,
            mensaje: kmDiaRes.mensaje,
            diasEstimados: masUrgente?.diasEstimados ?? null,
            fechaEstimada: masUrgente?.fechaEstimada ?? null,
            colorUrgencia: masUrgente?.colorUrgencia ?? prediccion_vehiculo_entity_1.ColorUrgencia.GRIS,
            predicciones,
            calculadoEn: new Date(),
        };
    }
    async getSnapshotVehiculo(vehiculoId) {
        return this.prediccionRepo.findOne({
            where: { vehiculo: { id: vehiculoId } },
        });
    }
    async getSnapshotFlota() {
        return this.prediccionRepo.find({
            relations: ['vehiculo'],
            order: { colorUrgencia: 'ASC', diasEstimados: 'ASC' },
        });
    }
    filtrarAnomalias(deltas) {
        if (deltas.length <= 1)
            return deltas;
        const resultado = [deltas[0]];
        for (let i = 1; i < deltas.length; i++) {
            const promAnterior = resultado.reduce((acc, d) => acc + d.deltaKm, 0) / resultado.length;
            if (deltas[i].deltaKm <= 2.5 * promAnterior) {
                resultado.push(deltas[i]);
            }
            else {
                this.logger.debug(`Delta anómalo descartado: ${deltas[i].deltaKm} km (promedio anterior: ${promAnterior})`);
            }
        }
        return resultado;
    }
    colorPorDias(dias) {
        if (dias <= 0)
            return prediccion_vehiculo_entity_1.ColorUrgencia.ROJO;
        if (dias <= 7)
            return prediccion_vehiculo_entity_1.ColorUrgencia.ROJO;
        if (dias <= 15)
            return prediccion_vehiculo_entity_1.ColorUrgencia.AMARILLO;
        return prediccion_vehiculo_entity_1.ColorUrgencia.VERDE;
    }
    async persistirSnapshot(vehiculoId, kmDia, masUrgente) {
        await this.prediccionRepo.upsert({
            vehiculo: { id: vehiculoId },
            kmPorDia: kmDia.kmPorDia,
            diasEstimados: masUrgente?.diasEstimados ?? null,
            fechaEstimada: masUrgente?.fechaEstimada ?? null,
            planNombre: masUrgente?.planNombre ?? null,
            colorUrgencia: masUrgente?.colorUrgencia ?? prediccion_vehiculo_entity_1.ColorUrgencia.GRIS,
            mensaje: kmDia.mensaje,
        }, ['vehiculo']);
    }
    async generarAlertaSiCambia(vehiculoId, masUrgente) {
        if (!masUrgente)
            return;
        if (masUrgente.colorUrgencia !== prediccion_vehiculo_entity_1.ColorUrgencia.AMARILLO &&
            masUrgente.colorUrgencia !== prediccion_vehiculo_entity_1.ColorUrgencia.ROJO)
            return;
        const tipoAlerta = masUrgente.colorUrgencia === prediccion_vehiculo_entity_1.ColorUrgencia.ROJO
            ? alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO
            : alerta_entity_1.TipoAlerta.MANTENIMIENTO_PROXIMO;
        const existente = await this.alertaRepo.findOne({
            where: {
                vehiculo: { id: vehiculoId },
                plan: { id: masUrgente.planId },
                tipoAlerta,
                leida: false,
            },
        });
        if (existente)
            return;
        const mensaje = masUrgente.colorUrgencia === prediccion_vehiculo_entity_1.ColorUrgencia.ROJO
            ? `[Predicción] Mantenimiento "${masUrgente.planNombre}" ya vencido o estimado en los próximos días.`
            : `[Predicción] "${masUrgente.planNombre}" estimado en ${masUrgente.diasEstimados} días (${masUrgente.fechaEstimada}).`;
        await this.alertaRepo.save(this.alertaRepo.create({
            vehiculo: { id: vehiculoId },
            plan: { id: masUrgente.planId },
            documento: null,
            tipoAlerta,
            mensaje,
        }));
    }
};
exports.PrediccionService = PrediccionService;
exports.PrediccionService = PrediccionService = PrediccionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prediccion_vehiculo_entity_1.PrediccionVehiculo)),
    __param(1, (0, typeorm_1.InjectRepository)(alerta_entity_1.Alerta)),
    __param(2, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.DataSource])
], PrediccionService);
//# sourceMappingURL=prediccion.service.js.map