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
var AlertasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alerta_entity_1 = require("./alerta.entity");
const configuracion_entity_1 = require("../configuracion/configuracion.entity");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
const usuario_entity_1 = require("../usuarios/usuario.entity");
const DEFAULT_UMBRAL_KM = 500;
const DEFAULT_UMBRAL_DIAS = 7;
const DOC_DIAS_ALERTA = [30, 15, 7];
const TIPOS_ALERTA_DOCUMENTO = [
    alerta_entity_1.TipoAlerta.DOCUMENTO_30DIAS,
    alerta_entity_1.TipoAlerta.DOCUMENTO_15DIAS,
    alerta_entity_1.TipoAlerta.DOCUMENTO_7DIAS,
    alerta_entity_1.TipoAlerta.DOCUMENTO_VENCIDO,
];
let AlertasService = AlertasService_1 = class AlertasService {
    alertaRepo;
    configRepo;
    vehiculoRepo;
    planRepo;
    documentoRepo;
    logger = new common_1.Logger(AlertasService_1.name);
    constructor(alertaRepo, configRepo, vehiculoRepo, planRepo, documentoRepo) {
        this.alertaRepo = alertaRepo;
        this.configRepo = configRepo;
        this.vehiculoRepo = vehiculoRepo;
        this.planRepo = planRepo;
        this.documentoRepo = documentoRepo;
    }
    async onModuleInit() {
        this.logger.log('Ejecutando evaluación global de alertas en el arranque...');
        try {
            const resultados = await this.ejecutarEvaluacionGlobal();
            const totalGeneradas = resultados.reduce((acc, r) => acc + r.generadas, 0);
            this.logger.log(`Evaluación completada. Alertas generadas: ${totalGeneradas}`);
        }
        catch (error) {
            this.logger.error('Error al evaluar alertas en el arranque:', error);
        }
    }
    async getUmbrales() {
        const filas = await this.configRepo.findBy({ clave: (0, typeorm_2.In)(['umbral_km', 'umbral_dias']) });
        const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valorEntero]));
        return {
            km: mapa['umbral_km'] ?? DEFAULT_UMBRAL_KM,
            dias: mapa['umbral_dias'] ?? DEFAULT_UMBRAL_DIAS,
        };
    }
    async actualizarUmbrales(km, dias) {
        if (km !== undefined) {
            if (km <= 0)
                throw new common_1.BadRequestException('El umbral de km debe ser un número positivo.');
            await this.configRepo.upsert({ clave: 'umbral_km', valorEntero: km }, ['clave']);
        }
        if (dias !== undefined) {
            if (dias <= 0)
                throw new common_1.BadRequestException('El umbral de días debe ser un número positivo.');
            await this.configRepo.upsert({ clave: 'umbral_dias', valorEntero: dias }, ['clave']);
        }
        return this.getUmbrales();
    }
    async evaluarAlertasMantenimiento(vehiculoId) {
        const vehiculo = await this.vehiculoRepo.findOne({ where: { id: vehiculoId } });
        if (!vehiculo) {
            throw new common_1.NotFoundException(`El vehículo #${vehiculoId} no existe`);
        }
        const { km: umbralKm, dias: umbralDias } = await this.getUmbrales();
        const hoy = new Date();
        const planes = await this.planRepo.find({
            where: { vehiculo: { id: vehiculoId }, activo: true },
            relations: ['vehiculo'],
        });
        if (planes.length === 0) {
            throw new common_1.BadRequestException(`El vehículo #${vehiculoId} no tiene ningún plan de mantenimiento activo para evaluar.`);
        }
        const generadas = [];
        for (const plan of planes) {
            const tipoAlerta = this.calcularTipoAlertaMantenimiento(plan, plan.vehiculo.kmActual, hoy, umbralKm, umbralDias);
            if (!tipoAlerta)
                continue;
            const existe = await this.alertaRepo.findOne({
                where: { plan: { id: plan.id }, tipoAlerta, leida: false },
            });
            if (existe)
                continue;
            const mensaje = this.buildMensajeMantenimiento(plan, tipoAlerta, plan.vehiculo.kmActual, hoy);
            const alerta = await this.alertaRepo.save(this.alertaRepo.create({
                vehiculo: { id: vehiculoId },
                plan: { id: plan.id },
                documento: null,
                tipoAlerta,
                mensaje,
            }));
            generadas.push(alerta);
        }
        await this.recalcularSemaforo(vehiculoId);
        return generadas;
    }
    async evaluarAlertasDocumentos(vehiculoId) {
        const vehiculo = await this.vehiculoRepo.findOne({ where: { id: vehiculoId } });
        if (!vehiculo) {
            throw new common_1.NotFoundException(`El vehículo #${vehiculoId} no existe`);
        }
        const hoy = new Date();
        const documentos = await this.documentoRepo.findBy({ vehiculo: { id: vehiculoId } });
        const generadas = [];
        for (const doc of documentos) {
            const diasRestantes = this.diasRestantes(new Date(doc.fechaVencimiento), hoy);
            const tipoAlerta = this.calcularTipoAlertaDocumento(diasRestantes);
            if (!tipoAlerta)
                continue;
            const existe = await this.alertaRepo.findOne({
                where: { documento: { id: doc.id }, tipoAlerta, leida: false },
            });
            if (existe)
                continue;
            const mensaje = this.buildMensajeDocumento(doc.tipo, tipoAlerta, diasRestantes, doc.fechaVencimiento);
            const alerta = await this.alertaRepo.save(this.alertaRepo.create({
                vehiculo: { id: vehiculoId },
                plan: null,
                documento: { id: doc.id },
                tipoAlerta,
                mensaje,
            }));
            if (tipoAlerta === alerta_entity_1.TipoAlerta.DOCUMENTO_VENCIDO && !doc.vencido) {
                await this.documentoRepo.update(doc.id, { vencido: true });
            }
            generadas.push(alerta);
        }
        await this.recalcularSemaforo(vehiculoId);
        return generadas;
    }
    async limpiarAlertasDocumento(documentoId) {
        const alertas = await this.alertaRepo.find({
            where: { documento: { id: documentoId }, leida: false },
            relations: ['vehiculo'],
        });
        if (alertas.length === 0)
            return;
        await this.alertaRepo.update({ documento: { id: documentoId }, leida: false }, { leida: true });
        const vehiculoId = alertas[0].vehiculo.id;
        await this.recalcularSemaforo(vehiculoId);
    }
    async listarAlertas(vehiculoId, filtro = 'todas', soloNoLeidas = true, rolUsuario) {
        if (rolUsuario === usuario_entity_1.RolUsuario.TECNICO && filtro === 'documento') {
            return [];
        }
        const qb = this.alertaRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.plan', 'pm')
            .leftJoinAndSelect('a.documento', 'dl')
            .where('a.vehiculo.id = :vehiculoId', { vehiculoId })
            .orderBy('a.generadaEn', 'DESC');
        if (soloNoLeidas)
            qb.andWhere('a.leida = false');
        if (rolUsuario === usuario_entity_1.RolUsuario.TECNICO) {
            qb.andWhere('a.tipoAlerta NOT IN (:...tiposDocumento)', {
                tiposDocumento: TIPOS_ALERTA_DOCUMENTO,
            });
        }
        if (filtro === 'mantenimiento') {
            qb.andWhere('a.tipoAlerta IN (:...tipos)', {
                tipos: [alerta_entity_1.TipoAlerta.MANTENIMIENTO_PROXIMO, alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO],
            });
        }
        else if (filtro === 'documento') {
            qb.andWhere('a.tipoAlerta IN (:...tipos)', {
                tipos: TIPOS_ALERTA_DOCUMENTO,
            });
        }
        return qb.getMany();
    }
    async marcarLeida(alertaId, vehiculoId) {
        const alerta = await this.alertaRepo.findOne({
            where: { id: alertaId, vehiculo: { id: vehiculoId } },
        });
        if (!alerta)
            throw new common_1.NotFoundException(`Alerta #${alertaId} no encontrada`);
        alerta.leida = true;
        const guardada = await this.alertaRepo.save(alerta);
        await this.recalcularSemaforo(vehiculoId);
        return guardada;
    }
    async ejecutarEvaluacionGlobal() {
        const vehiculos = await this.vehiculoRepo.findBy({ activo: true });
        const resultados = await Promise.allSettled(vehiculos.map(async (v) => {
            const [mant, doc] = await Promise.all([
                this.evaluarAlertasMantenimiento(v.id),
                this.evaluarAlertasDocumentos(v.id),
            ]);
            return { vehiculoId: v.id, generadas: mant.length + doc.length };
        }));
        return resultados
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);
    }
    async recalcularSemaforo(vehiculoId) {
        const alertasActivas = await this.alertaRepo.find({
            where: { vehiculo: { id: vehiculoId }, leida: false },
            select: ['tipoAlerta'],
        });
        const tipos = new Set(alertasActivas.map((a) => a.tipoAlerta));
        let semaforo;
        if (tipos.has(alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO) ||
            tipos.has(alerta_entity_1.TipoAlerta.DOCUMENTO_VENCIDO) ||
            tipos.has(alerta_entity_1.TipoAlerta.DOCUMENTO_7DIAS)) {
            semaforo = vehiculo_entity_1.EstadoSemaforo.ROJO;
        }
        else if (tipos.has(alerta_entity_1.TipoAlerta.MANTENIMIENTO_PROXIMO) ||
            tipos.has(alerta_entity_1.TipoAlerta.DOCUMENTO_15DIAS) ||
            tipos.has(alerta_entity_1.TipoAlerta.DOCUMENTO_30DIAS)) {
            semaforo = vehiculo_entity_1.EstadoSemaforo.AMARILLO;
        }
        else {
            semaforo = vehiculo_entity_1.EstadoSemaforo.VERDE;
        }
        await this.vehiculoRepo.update(vehiculoId, { estadoSemaforo: semaforo });
    }
    calcularTipoAlertaMantenimiento(plan, kmActual, hoy, umbralKm, umbralDias) {
        let tipoAlerta = null;
        if ([plan_mantenimiento_entity_1.TipoCiclo.KM, plan_mantenimiento_entity_1.TipoCiclo.COMBINADO].includes(plan.tipoCiclo) &&
            plan.kmProximo !== null) {
            const kmRestantes = plan.kmProximo - kmActual;
            if (kmRestantes <= 0) {
                tipoAlerta = alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO;
            }
            else if (kmRestantes <= umbralKm) {
                tipoAlerta = alerta_entity_1.TipoAlerta.MANTENIMIENTO_PROXIMO;
            }
        }
        if ([plan_mantenimiento_entity_1.TipoCiclo.DIAS, plan_mantenimiento_entity_1.TipoCiclo.COMBINADO].includes(plan.tipoCiclo) &&
            plan.fechaProxima !== null) {
            const diasRest = this.diasRestantes(new Date(plan.fechaProxima), hoy);
            if (diasRest <= 0) {
                tipoAlerta = alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO;
            }
            else if (diasRest <= umbralDias && tipoAlerta !== alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO) {
                tipoAlerta = alerta_entity_1.TipoAlerta.MANTENIMIENTO_PROXIMO;
            }
        }
        return tipoAlerta;
    }
    calcularTipoAlertaDocumento(diasRestantes) {
        if (diasRestantes <= 0)
            return alerta_entity_1.TipoAlerta.DOCUMENTO_VENCIDO;
        if (diasRestantes <= 7)
            return alerta_entity_1.TipoAlerta.DOCUMENTO_7DIAS;
        if (diasRestantes <= 15)
            return alerta_entity_1.TipoAlerta.DOCUMENTO_15DIAS;
        if (diasRestantes <= 30)
            return alerta_entity_1.TipoAlerta.DOCUMENTO_30DIAS;
        return null;
    }
    diasRestantes(fecha, hoy) {
        const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        return Math.ceil((f.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
    }
    buildMensajeMantenimiento(plan, tipo, kmActual, hoy) {
        if (tipo === alerta_entity_1.TipoAlerta.MANTENIMIENTO_VENCIDO) {
            return `Mantenimiento vencido: "${plan.nombre}". Requiere intervención inmediata.`;
        }
        const partes = [];
        if ([plan_mantenimiento_entity_1.TipoCiclo.KM, plan_mantenimiento_entity_1.TipoCiclo.COMBINADO].includes(plan.tipoCiclo) && plan.kmProximo !== null) {
            partes.push(`${plan.kmProximo - kmActual} km restantes`);
        }
        if ([plan_mantenimiento_entity_1.TipoCiclo.DIAS, plan_mantenimiento_entity_1.TipoCiclo.COMBINADO].includes(plan.tipoCiclo) && plan.fechaProxima !== null) {
            const dias = this.diasRestantes(new Date(plan.fechaProxima), hoy);
            partes.push(`${dias} días restantes`);
        }
        return `Próximo mantenimiento: "${plan.nombre}" — ${partes.join(', ')}.`;
    }
    buildMensajeDocumento(tipo, tipoAlerta, diasRestantes, fechaVencimiento) {
        const nombre = tipo === 'SOAT' ? 'SOAT' : 'Revisión Técnico-Mecánica';
        const fecha = this.formatearFecha(fechaVencimiento);
        if (tipoAlerta === alerta_entity_1.TipoAlerta.DOCUMENTO_VENCIDO) {
            return `${nombre} VENCIDO desde hace ${Math.abs(diasRestantes)} día(s). Vencimiento: ${fecha}.`;
        }
        return `${nombre} vence en ${diasRestantes} día(s) (${fecha}). Renueve a tiempo.`;
    }
    formatearFecha(fechaStr) {
        try {
            const fecha = new Date(fechaStr + 'T00:00:00');
            return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        catch {
            return fechaStr;
        }
    }
};
exports.AlertasService = AlertasService;
exports.AlertasService = AlertasService = AlertasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alerta_entity_1.Alerta)),
    __param(1, (0, typeorm_1.InjectRepository)(configuracion_entity_1.Configuracion)),
    __param(2, (0, typeorm_1.InjectRepository)(vehiculo_entity_1.Vehiculo)),
    __param(3, (0, typeorm_1.InjectRepository)(plan_mantenimiento_entity_1.PlanMantenimiento)),
    __param(4, (0, typeorm_1.InjectRepository)(documento_legal_entity_1.DocumentoLegal)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AlertasService);
//# sourceMappingURL=alertas.service.js.map