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
exports.SaludFinancieraService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const salud_financiera_entity_1 = require("./salud-financiera.entity");
let SaludFinancieraService = class SaludFinancieraService {
    saludRepo;
    dataSource;
    constructor(saludRepo, dataSource) {
        this.saludRepo = saludRepo;
        this.dataSource = dataSource;
    }
    async recalcularPorVehiculo(vehiculoId, periodo) {
        const mes = periodo ?? this.periodoActual();
        const [fila] = await this.dataSource.query(`SELECT
          COALESCE(SUM(ot.costo_total), 0)::float          AS "costoTotal",
          CASE WHEN COUNT(ot.id) > 0
               THEN (SUM(ot.costo_total) / COUNT(ot.id))::float
               ELSE 0
          END                                              AS "costoPromedio",
          COUNT(ot.id)::int                                AS "numIntervenciones"
       FROM orden_trabajo ot
       WHERE ot.vehiculo_id = $1
         AND ot.estado      = 'Cerrada'
         AND to_char(ot.fecha_cierre, 'YYYY-MM') = $2`, [vehiculoId, mes]);
        const [repuesto] = await this.dataSource.query(`SELECT ro.nombre_repuesto AS nombre, SUM(ro.cantidad)::int AS cantidad
       FROM repuesto_orden ro
       JOIN orden_trabajo  ot ON ot.id = ro.orden_id
       WHERE ot.vehiculo_id = $1
         AND ot.estado      = 'Cerrada'
         AND to_char(ot.fecha_cierre, 'YYYY-MM') = $2
       GROUP BY ro.nombre_repuesto
       ORDER BY cantidad DESC
       LIMIT 1`, [vehiculoId, mes]);
        await this.saludRepo.upsert({
            vehiculo: { id: vehiculoId },
            periodo: mes,
            costoTotal: fila.costoTotal,
            costoPromedio: fila.costoPromedio,
            numIntervenciones: fila.numIntervenciones,
            repuestoMasUsado: repuesto?.nombre ?? null,
            cantidadRepuesto: repuesto?.cantidad ?? null,
        }, ['vehiculo', 'periodo']);
    }
    async getInsights(periodo) {
        const mes = periodo ?? this.periodoActual();
        const mesAnterior = this.mesAnterior(mes);
        const [topVehiculo] = await this.dataSource.query(`SELECT v.id AS "vehiculoId", v.placa, v.marca,
              sf.costo_total::float AS "costoTotal"
       FROM salud_financiera sf
       JOIN vehiculo v ON v.id = sf.vehiculo_id
       WHERE sf.periodo = $1
       ORDER BY sf.costo_total DESC
       LIMIT 1`, [mes]);
        let variacionPct = null;
        if (topVehiculo) {
            const [anterior] = await this.dataSource.query(`SELECT costo_total::float AS "costoTotal"
         FROM salud_financiera
         WHERE vehiculo_id = $1 AND periodo = $2`, [topVehiculo.vehiculoId, mesAnterior]);
            if (anterior && anterior.costoTotal > 0) {
                variacionPct = ((topVehiculo.costoTotal - anterior.costoTotal) / anterior.costoTotal) * 100;
            }
        }
        const [topTecnico] = await this.dataSource.query(`SELECT u.id AS "tecnicoId", u.nombre, COUNT(ot.id)::int AS "otCerradas"
       FROM orden_trabajo ot
       JOIN usuario u ON u.id = ot.tecnico_id
       WHERE ot.estado = 'Cerrada'
         AND to_char(ot.fecha_cierre, 'YYYY-MM') = $1
       GROUP BY u.id
       ORDER BY "otCerradas" DESC
       LIMIT 1`, [mes]);
        const [topRepuesto] = await this.dataSource.query(`SELECT ro.nombre_repuesto AS nombre, SUM(ro.cantidad)::int AS cantidad
       FROM repuesto_orden ro
       JOIN orden_trabajo  ot ON ot.id = ro.orden_id
       WHERE ot.estado = 'Cerrada'
         AND to_char(ot.fecha_cierre, 'YYYY-MM') = $1
       GROUP BY ro.nombre_repuesto
       ORDER BY cantidad DESC
       LIMIT 1`, [mes]);
        return {
            periodo: mes,
            vehiculoMasCostoso: topVehiculo
                ? { ...topVehiculo, variacionPct: variacionPct !== null ? Math.round(variacionPct * 100) / 100 : null }
                : null,
            tecnicoMasActivo: topTecnico ?? null,
            repuestoMasUsado: topRepuesto ?? null,
        };
    }
    async getRanking(periodo = 'mes') {
        const { desde, hasta } = this.rangoFechas(periodo);
        const periodoAnterior = this.rangoFechas(periodo, true);
        const filas = await this.dataSource.query(`SELECT v.id AS "vehiculoId", v.placa, v.marca, v.modelo,
              COALESCE(SUM(ot.costo_total), 0)::float AS "costoTotal",
              COUNT(ot.id)::int                        AS "intervenciones"
       FROM vehiculo v
       LEFT JOIN orden_trabajo ot
              ON ot.vehiculo_id = v.id
             AND ot.estado      = 'Cerrada'
             AND ot.fecha_cierre BETWEEN $1::date AND $2::date
       WHERE v.activo = TRUE
       GROUP BY v.id
       ORDER BY "costoTotal" DESC`, [desde, hasta]);
        if (filas.length === 0)
            return [];
        const [anteriorTop1] = await this.dataSource.query(`SELECT v.id AS "vehiculoId"
       FROM vehiculo v
       JOIN orden_trabajo ot ON ot.vehiculo_id = v.id
       WHERE ot.estado = 'Cerrada'
         AND ot.fecha_cierre BETWEEN $1::date AND $2::date
       GROUP BY v.id
       ORDER BY SUM(ot.costo_total) DESC
       LIMIT 1`, [periodoAnterior.desde, periodoAnterior.hasta]);
        const maxCosto = filas[0].costoTotal || 1;
        const total = filas.length;
        const umbralRojo = Math.ceil(total * 0.2);
        const umbralAmari = Math.ceil(total * 0.6);
        return filas.map((f, idx) => ({
            posicion: idx + 1,
            vehiculoId: f.vehiculoId,
            placa: f.placa,
            marca: f.marca,
            modelo: f.modelo,
            costoTotal: f.costoTotal,
            intervenciones: f.intervenciones,
            barraRelativa: Math.round((f.costoTotal / maxCosto) * 100),
            codigoColor: idx < umbralRojo
                ? 'rojo'
                : idx < umbralAmari
                    ? 'amarillo'
                    : 'verde',
            nuevoTop: idx === 0 && anteriorTop1 && anteriorTop1.vehiculoId !== f.vehiculoId,
        }));
    }
    periodoActual() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    mesAnterior(periodo) {
        const [anio, mes] = periodo.split('-').map(Number);
        const d = new Date(anio, mes - 2, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    rangoFechas(periodo, anterior = false) {
        const hoy = new Date();
        let desde;
        let hasta;
        switch (periodo) {
            case 'trimestre':
                desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
                hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                break;
            case 'semestre':
                desde = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
                hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                break;
            case 'anio':
                desde = new Date(hoy.getFullYear(), 0, 1);
                hasta = new Date(hoy.getFullYear(), 11, 31);
                break;
            default:
                desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
        if (anterior) {
            const diffMs = hasta.getTime() - desde.getTime();
            hasta = new Date(desde.getTime() - 1);
            desde = new Date(hasta.getTime() - diffMs);
        }
        const fmt = (d) => d.toISOString().split('T')[0];
        return { desde: fmt(desde), hasta: fmt(hasta) };
    }
};
exports.SaludFinancieraService = SaludFinancieraService;
exports.SaludFinancieraService = SaludFinancieraService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(salud_financiera_entity_1.SaludFinanciera)),
    __param(1, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.DataSource])
], SaludFinancieraService);
//# sourceMappingURL=salud-financiera.service.js.map