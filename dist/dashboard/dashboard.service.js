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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const prediccion_service_1 = require("../prediccion/prediccion.service");
const salud_financiera_service_1 = require("../salud-financiera/salud-financiera.service");
const usuario_entity_1 = require("../usuarios/usuario.entity");
const TIPOS_ALERTA_DOCUMENTO = [
    'documento_30dias',
    'documento_15dias',
    'documento_7dias',
    'documento_vencido',
];
let DashboardService = class DashboardService {
    dataSource;
    prediccionService;
    saludService;
    constructor(dataSource, prediccionService, saludService) {
        this.dataSource = dataSource;
        this.prediccionService = prediccionService;
        this.saludService = saludService;
    }
    async getDashboard(rolUsuario) {
        const vehiculos = await this.dataSource.query(`SELECT id, placa, marca, modelo, anio, km_actual, estado_semaforo
       FROM vehiculo
       WHERE activo = TRUE
       ORDER BY estado_semaforo DESC, placa ASC`);
        const snapshots = await this.prediccionService.getSnapshotFlota();
        const snapshotMap = new Map(snapshots.map((s) => [s.vehiculo?.id, s]));
        const tarjetas = await Promise.all(vehiculos.map((v) => this.buildTarjeta(v, snapshotMap.get(v.id) ?? null, rolUsuario)));
        const resumen = { verde: 0, amarillo: 0, rojo: 0 };
        for (const t of tarjetas)
            resumen[t.estadoSemaforo]++;
        const insights = await this.saludService.getInsights();
        return {
            totalVehiculos: vehiculos.length,
            resumenSemaforo: resumen,
            vehiculos: tarjetas,
            insights,
        };
    }
    async getDetalleVehiculo(vehiculoId, rolUsuario) {
        const [vehiculo] = await this.dataSource.query(`SELECT id, placa, marca, modelo, anio, km_actual, estado_semaforo
       FROM vehiculo WHERE id = $1`, [vehiculoId]);
        const prediccion = await this.prediccionService.calcularPrediccion(vehiculoId);
        const tarjeta = await this.buildTarjeta(vehiculo, prediccion, rolUsuario);
        const filtroAlertas = this.filtroAlertasPorRol(rolUsuario);
        const alertas = await this.dataSource.query(`SELECT id, tipo_alerta AS "tipoAlerta", mensaje, generada_en AS "generadaEn"
       FROM alerta
       WHERE vehiculo_id = $1 AND leida = FALSE ${filtroAlertas.sql}
       ORDER BY generada_en DESC`, [vehiculoId, ...filtroAlertas.params]);
        const planesDb = await this.dataSource.query(`SELECT id, nombre, tipo_ciclo AS "tipoCiclo",
              km_proximo AS "kmProximo",
              fecha_proxima::text AS "fechaProxima",
              CASE WHEN km_proximo IS NOT NULL
                   THEN km_proximo - (SELECT km_actual FROM vehiculo WHERE id = $1)
                   ELSE NULL
              END AS "kmRestantes"
       FROM plan_mantenimiento
       WHERE vehiculo_id = $1 AND activo = TRUE
       ORDER BY km_proximo ASC NULLS LAST`, [vehiculoId]);
        const snapshot = await this.prediccionService.getSnapshotVehiculo(vehiculoId);
        const planes = planesDb.map(p => {
            const pred = prediccion.predicciones.find(pr => pr.planId === p.id);
            let fProx = p.fechaProxima || pred?.fechaEstimada || null;
            if (!fProx && snapshot && snapshot.planNombre === p.nombre) {
                fProx = snapshot.fechaEstimada;
            }
            return {
                ...p,
                fechaProxima: fProx,
            };
        });
        const hoy = new Date();
        const documentosRaw = await this.dataSource.query(`SELECT id, tipo, fecha_vencimiento::text, vencido
       FROM documento_legal
       WHERE vehiculo_id = $1`, [vehiculoId]);
        const documentos = documentosRaw.map((d) => ({
            id: d.id,
            tipo: d.tipo,
            fechaVencimiento: d.fecha_vencimiento,
            vencido: d.vencido,
            diasRestantes: Math.ceil((new Date(d.fecha_vencimiento).getTime() - hoy.getTime()) /
                (1000 * 60 * 60 * 24)),
        }));
        return { vehiculo: tarjeta, alertas, planes, documentos };
    }
    async buildTarjeta(v, snapshot, rolUsuario) {
        const filtroAlertas = this.filtroAlertasPorRol(rolUsuario);
        const alertas = await this.dataSource.query(`SELECT id, tipo_alerta AS "tipoAlerta", mensaje, generada_en AS "generadaEn"
       FROM alerta
       WHERE vehiculo_id = $1 AND leida = FALSE ${filtroAlertas.sql}
       ORDER BY generada_en DESC
       LIMIT 5`, [v.id, ...filtroAlertas.params]);
        return {
            vehiculoId: v.id,
            placa: v.placa,
            marca: v.marca,
            modelo: v.modelo,
            anio: v.anio,
            estadoSemaforo: v.estado_semaforo,
            kmActual: v.km_actual,
            kmPorDia: snapshot?.kmPorDia ?? null,
            diasEstimados: snapshot?.diasEstimados ?? null,
            fechaEstimada: snapshot?.fechaEstimada ?? null,
            colorPrediccion: snapshot?.colorUrgencia ?? 'gris',
            alertasActivas: alertas.length,
            alertasDetalle: alertas,
        };
    }
    filtroAlertasPorRol(rolUsuario) {
        if (rolUsuario !== usuario_entity_1.RolUsuario.TECNICO) {
            return { sql: '', params: [] };
        }
        return {
            sql: 'AND tipo_alerta <> ALL($2)',
            params: [TIPOS_ALERTA_DOCUMENTO],
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        prediccion_service_1.PrediccionService,
        salud_financiera_service_1.SaludFinancieraService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map