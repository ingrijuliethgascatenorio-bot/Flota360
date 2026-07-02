import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FiltroReporteDto } from './dto/filtro-reporte.dto';

export interface MetricasReporte {
  costoTotal: number;
  costoPromedio: number;
  numIntervenciones: number;
}

export interface FilaReporteDetalle {
  ordenId: number;
  vehiculoId: number;
  placa: string;
  tecnicoId: number;
  tecnicoNombre: string;
  fechaApertura: string;
  fechaCierre: string | null;
  costoManoObra: number;
  costoRepuestos: number;
  costoTotal: number;
  repuestos: {
    nombreRepuesto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  fotosTotal: number;
  descripcion: string | null;
}

export interface CostosPorVehiculo {
  vehiculoId: number;
  placa: string;
  marca: string;
  modelo: string;
  costoTotal: number;
  intervenciones: number;
}

export interface ReporteCostos {
  filtros: FiltroReporteDto;
  metricas: MetricasReporte;
  detalle: FilaReporteDetalle[];
  porVehiculo: CostosPorVehiculo[];
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async reporteCostos(filtros: FiltroReporteDto): Promise<ReporteCostos> {
    // ── Parámetros y cláusulas separadas por query ────────────────────────
    // Query 1 y 2 tienen JOIN usuario → pueden filtrar por u.id (tecnicoId)
    // Query 3 (porVehiculo) NO tiene JOIN usuario → solo filtra por v.id y fechas

    const paramsConTecnico: unknown[] = [];
    const paramsSinTecnico: unknown[] = [];

    const whereConTecnico = this.buildWhere(filtros, paramsConTecnico, true);
    const whereSinTecnico = this.buildWhere(filtros, paramsSinTecnico, false);

    // ── 1. Detalle de órdenes (tiene JOIN usuario) ────────────────────────
    const detalle: FilaReporteDetalle[] = await this.dataSource.query(
      `SELECT
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
       ORDER BY ot.fecha_apertura DESC`,
      paramsConTecnico,
    );

    // ── 2. Métricas globales (tiene JOIN usuario) ─────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [meta] = await this.dataSource.query(
      `SELECT
          COALESCE(SUM(ot.costo_total), 0)::float  AS "costoTotal",
          COALESCE(AVG(ot.costo_total), 0)::float  AS "costoPromedio",
          COUNT(ot.id)::int                        AS "numIntervenciones"
       FROM orden_trabajo ot
       JOIN vehiculo v ON v.id = ot.vehiculo_id
       JOIN usuario  u ON u.id = ot.tecnico_id
       WHERE ot.estado = 'Cerrada'
         ${whereConTecnico}`,
      paramsConTecnico,
    );

    // ── 3. Agrupado por vehículo (SIN JOIN usuario) ───────────────────────
    const porVehiculo: CostosPorVehiculo[] = await this.dataSource.query(
      `SELECT
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
       ORDER BY "costoTotal" DESC`,
      paramsSinTecnico,
    );

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

  // ── buildWhere con flag para incluir o no el filtro de técnico ────────────
  private buildWhere(
    filtros: FiltroReporteDto,
    params: unknown[],
    includeTecnico: boolean,
  ): string {
    const clauses: string[] = [];

    if (filtros.vehiculoId) {
      params.push(filtros.vehiculoId);
      clauses.push(`AND v.id = $${params.length}`);
    }

    // Solo se añade cuando el query tiene JOIN usuario
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
      clauses.push(
        `AND ot.fecha_cierre < ($${params.length}::date + INTERVAL '1 day')`,
      );
    }

    return clauses.join('\n');
  }
}
