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
exports.ReportesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let ReportesService = class ReportesService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async reporteCostos(filtros) {
        const paramsConTecnico = [];
        const paramsSinTecnico = [];
        const whereConTecnico = this.buildWhere(filtros, paramsConTecnico, true);
        const whereSinTecnico = this.buildWhere(filtros, paramsSinTecnico, false);
        const detalle = await this.dataSource.query(`SELECT
          ot.id                                        AS "ordenId",
          v.id                                         AS "vehiculoId",
          v.placa,
          u.id                                         AS "tecnicoId",
          u.nombre                                     AS "tecnicoNombre",
          ot.fecha_apertura::text                      AS "fechaApertura",
          ot.fecha_cierre::text                        AS "fechaCierre",
          ot.costo_mano_obra::float                    AS "costoManoObra",
          COALESCE(SUM(ro.subtotal), 0)::float         AS "costoRepuestos",
          ot.costo_total::float                        AS "costoTotal",
          COALESCE((
            SELECT json_agg(json_build_object(
              'nombreRepuesto', r2.nombre_repuesto,
              'cantidad', r2.cantidad,
              'precioUnitario', r2.precio_unitario::float,
              'subtotal', r2.subtotal::float
            ) ORDER BY r2.id)
            FROM repuesto_orden r2
            WHERE r2.orden_id = ot.id
          ), '[]'::json)                              AS repuestos,
          (
            SELECT COUNT(f.id)::int
            FROM foto_orden f
            WHERE f.orden_id = ot.id
          )                                           AS "fotosTotal",
          ot.descripcion
       FROM orden_trabajo ot
       JOIN vehiculo      v  ON v.id  = ot.vehiculo_id
       JOIN usuario       u  ON u.id  = ot.tecnico_id
       LEFT JOIN repuesto_orden ro ON ro.orden_id = ot.id
       WHERE ot.estado = 'Cerrada'
         ${whereConTecnico}
       GROUP BY ot.id, v.id, u.id
       ORDER BY ot.fecha_apertura DESC`, paramsConTecnico);
        const [meta] = await this.dataSource.query(`SELECT
          COALESCE(SUM(ot.costo_total), 0)::float  AS "costoTotal",
          COALESCE(AVG(ot.costo_total), 0)::float  AS "costoPromedio",
          COUNT(ot.id)::int                        AS "numIntervenciones"
       FROM orden_trabajo ot
       JOIN vehiculo v ON v.id = ot.vehiculo_id
       JOIN usuario  u ON u.id = ot.tecnico_id
       WHERE ot.estado = 'Cerrada'
         ${whereConTecnico}`, paramsConTecnico);
        const porVehiculo = await this.dataSource.query(`SELECT
          v.id                                         AS "vehiculoId",
          v.placa,
          v.marca,
          v.modelo,
          COALESCE(SUM(ot.costo_total), 0)::float      AS "costoTotal",
          COUNT(ot.id)::int                            AS "intervenciones"
       FROM orden_trabajo ot
       JOIN vehiculo v ON v.id = ot.vehiculo_id
       WHERE ot.estado = 'Cerrada'
         ${whereSinTecnico}
       GROUP BY v.id
       ORDER BY "costoTotal" DESC`, paramsSinTecnico);
        return {
            filtros,
            metricas: {
                costoTotal: meta.costoTotal,
                costoPromedio: meta.costoPromedio,
                numIntervenciones: meta.numIntervenciones,
            },
            detalle,
            porVehiculo,
        };
    }
    buildWhere(filtros, params, includeTecnico) {
        const clauses = [];
        if (filtros.vehiculoId) {
            params.push(filtros.vehiculoId);
            clauses.push(`AND v.id = $${params.length}`);
        }
        if (includeTecnico && filtros.tecnicoId) {
            params.push(filtros.tecnicoId);
            clauses.push(`AND u.id = $${params.length}`);
        }
        if (filtros.fechaDesde) {
            params.push(filtros.fechaDesde);
            clauses.push(`AND ot.fecha_cierre >= $${params.length}::date`);
        }
        if (filtros.fechaHasta) {
            params.push(filtros.fechaHasta);
            clauses.push(`AND ot.fecha_cierre < ($${params.length}::date + INTERVAL '1 day')`);
        }
        return clauses.join('\n');
    }
};
exports.ReportesService = ReportesService;
exports.ReportesService = ReportesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], ReportesService);
//# sourceMappingURL=reportes.service.js.map