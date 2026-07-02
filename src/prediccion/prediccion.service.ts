import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PrediccionVehiculo, ColorUrgencia } from './prediccion-vehiculo.entity';
import { Alerta, TipoAlerta } from '../alertas/alerta.entity';

const MIN_REGISTROS   = 2;   // mínimo para calcular km/día (RF-INN-01)
const DIAS_LABORABLES = 7;   // ventana de análisis

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface KmDiaResultado {
  vehiculoId:  number;
  kmPorDia:    number | null;
  registros:   number;
  suficiente:  boolean;
  mensaje:     string | null;
}

export interface PrediccionPlan {
  planId:         number;
  planNombre:     string;
  kmRestantes:    number | null;
  diasEstimados:  number | null;
  fechaEstimada:  string | null;
  colorUrgencia:  ColorUrgencia;
}

export interface PrediccionCompleta {
  vehiculoId:     number;
  placa:          string;
  kmPorDia:       number | null;
  suficiente:     boolean;
  mensaje:        string | null;
  diasEstimados:  number | null;
  fechaEstimada:  string | null;
  colorUrgencia:  ColorUrgencia;
  predicciones:   PrediccionPlan[];
  calculadoEn:    Date;
}

@Injectable()
export class PrediccionService {
  private readonly logger = new Logger(PrediccionService.name);

  constructor(
    @InjectRepository(PrediccionVehiculo)
    private readonly prediccionRepo: Repository<PrediccionVehiculo>,

    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // RF-INN-01 — Cálculo de km/día por vehículo
  // ══════════════════════════════════════════════════════════════════════════

  async calcularKmDia(vehiculoId: number): Promise<KmDiaResultado> {
    // Recuperar los últimos N registros de km de los últimos 7 días hábiles
    const registros: Array<{ km_valor: number; registrado_en: Date }> =
      await this.dataSource.query(
        `SELECT km_valor, registrado_en
         FROM registro_km
         WHERE vehiculo_id = $1
           AND registrado_en >= NOW() - INTERVAL '${DIAS_LABORABLES} days'
         ORDER BY registrado_en ASC`,
        [vehiculoId],
      );

    if (registros.length < MIN_REGISTROS) {
      return {
        vehiculoId,
        kmPorDia:   null,
        registros:  registros.length,
        suficiente: false,
        mensaje:    'Datos insuficientes',
      };
    }

    // Calcular deltas entre registros consecutivos
    const deltas: Array<{ deltaKm: number; deltaDias: number }> = [];
    for (let i = 1; i < registros.length; i++) {
      const deltaKm   = registros[i].km_valor - registros[i - 1].km_valor;
      const deltaDias =
        (new Date(registros[i].registrado_en).getTime() -
          new Date(registros[i - 1].registrado_en).getTime()) /
        (1000 * 60 * 60 * 24);

      if (deltaKm < 0 || deltaDias <= 0) continue; // ignorar retrocesos
      deltas.push({ deltaKm, deltaDias });
    }

    // Filtrar anomalías: Δkm > 2.5 × promedio previo (RF-INN-01)
    const deltasFiltrados = this.filtrarAnomalias(deltas);

    if (deltasFiltrados.length === 0) {
      return {
        vehiculoId,
        kmPorDia:   0,
        registros:  registros.length,
        suficiente: true,
        mensaje:    'Sin actividad reciente',
      };
    }

    const totalKm   = deltasFiltrados.reduce((acc, d) => acc + d.deltaKm, 0);
    const totalDias = deltasFiltrados.reduce((acc, d) => acc + d.deltaDias, 0);
    const kmPorDia  = totalDias > 0 ? Math.round((totalKm / totalDias) * 100) / 100 : 0;

    return {
      vehiculoId,
      kmPorDia,
      registros: registros.length,
      suficiente: true,
      mensaje:    kmPorDia === 0 ? 'Sin actividad reciente' : null,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RF-INN-02 — Predicción de fecha de mantenimiento por vehículo
  // ══════════════════════════════════════════════════════════════════════════

  async calcularPrediccion(vehiculoId: number): Promise<PrediccionCompleta> {
    const kmDiaRes = await this.calcularKmDia(vehiculoId);

    // Obtener vehículo y sus planes activos
    const [vehiculo]: Array<{ id: number; placa: string; km_actual: number }> =
      await this.dataSource.query(
        `SELECT id, placa, km_actual FROM vehiculo WHERE id = $1`,
        [vehiculoId],
      );

    const planes: Array<{
      id: number; nombre: string; tipo_ciclo: string;
      km_proximo: number | null; fecha_proxima: string | null;
    }> = await this.dataSource.query(
      `SELECT id, nombre, tipo_ciclo, km_proximo, fecha_proxima
       FROM plan_mantenimiento
       WHERE vehiculo_id = $1 AND activo = TRUE`,
      [vehiculoId],
    );

    const hoy       = new Date();
    const predicciones: PrediccionPlan[] = [];

    for (const plan of planes) {
      let diasEstimados: number | null = null;
      let fechaEstimada: string | null = null;
      let kmRestantes:   number | null = null;
      let color = ColorUrgencia.GRIS;

      // Calcular por km si aplica
      if (
        ['km', 'combinado'].includes(plan.tipo_ciclo) &&
        plan.km_proximo !== null
      ) {
        kmRestantes = plan.km_proximo - vehiculo.km_actual;

        if (kmRestantes <= 0) {
          diasEstimados = 0;
          color         = ColorUrgencia.ROJO;
          fechaEstimada = hoy.toISOString().split('T')[0];
        } else if (kmDiaRes.kmPorDia && kmDiaRes.kmPorDia > 0) {
          diasEstimados = Math.ceil(kmRestantes / kmDiaRes.kmPorDia);
          const fe      = new Date(hoy);
          fe.setDate(fe.getDate() + diasEstimados);
          fechaEstimada = fe.toISOString().split('T')[0];
          color         = this.colorPorDias(diasEstimados);
        }
      }

      // Calcular por fecha si aplica (o combinar)
      if (
        ['dias', 'combinado'].includes(plan.tipo_ciclo) &&
        plan.fecha_proxima !== null
      ) {
        const diasFecha = Math.ceil(
          (new Date(plan.fecha_proxima).getTime() - hoy.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Tomar el más urgente
        if (diasEstimados === null || diasFecha < diasEstimados) {
          diasEstimados = diasFecha;
          fechaEstimada = diasFecha > 0
            ? plan.fecha_proxima
            : plan.fecha_proxima;
          color = this.colorPorDias(diasFecha);
        }
      }

      predicciones.push({
        planId:        plan.id,
        planNombre:    plan.nombre,
        kmRestantes,
        diasEstimados,
        fechaEstimada,
        colorUrgencia: color,
      });
    }

    // Ordenar de más urgente a menos (RF-INN-03)
    predicciones.sort((a, b) => {
      const orden = { rojo: 0, amarillo: 1, verde: 2, gris: 3 };
      return orden[a.colorUrgencia] - orden[b.colorUrgencia];
    });

    // Plan más urgente → snapshot en BD
    const masUrgente = predicciones[0] ?? null;

    await this.persistirSnapshot(vehiculoId, kmDiaRes, masUrgente);
    await this.generarAlertaSiCambia(vehiculoId, masUrgente);

    return {
      vehiculoId,
      placa:       vehiculo.placa,
      kmPorDia:    kmDiaRes.kmPorDia,
      suficiente:  kmDiaRes.suficiente,
      mensaje:     kmDiaRes.mensaje,
      diasEstimados: masUrgente?.diasEstimados ?? null,
      fechaEstimada: masUrgente?.fechaEstimada ?? null,
      colorUrgencia: masUrgente?.colorUrgencia ?? ColorUrgencia.GRIS,
      predicciones,
      calculadoEn: new Date(),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RF-INN-03 — Leer snapshot persistido (para el dashboard)
  // ══════════════════════════════════════════════════════════════════════════

  async getSnapshotVehiculo(vehiculoId: number): Promise<PrediccionVehiculo | null> {
    return this.prediccionRepo.findOne({
      where: { vehiculo: { id: vehiculoId } },
    });
  }

  async getSnapshotFlota(): Promise<PrediccionVehiculo[]> {
    return this.prediccionRepo.find({
      relations: ['vehiculo'],
      order:     { colorUrgencia: 'ASC', diasEstimados: 'ASC' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers privados
  // ══════════════════════════════════════════════════════════════════════════

  private filtrarAnomalias(
    deltas: Array<{ deltaKm: number; deltaDias: number }>,
  ): Array<{ deltaKm: number; deltaDias: number }> {
    if (deltas.length <= 1) return deltas;

    const resultado: Array<{ deltaKm: number; deltaDias: number }> = [deltas[0]];

    for (let i = 1; i < deltas.length; i++) {
      const promAnterior =
        resultado.reduce((acc, d) => acc + d.deltaKm, 0) / resultado.length;
      if (deltas[i].deltaKm <= 2.5 * promAnterior) {
        resultado.push(deltas[i]);
      } else {
        this.logger.debug(
          `Delta anómalo descartado: ${deltas[i].deltaKm} km (promedio anterior: ${promAnterior})`,
        );
      }
    }

    return resultado;
  }

  private colorPorDias(dias: number): ColorUrgencia {
    if (dias <= 0)   return ColorUrgencia.ROJO;
    if (dias <= 7)   return ColorUrgencia.ROJO;
    if (dias <= 15)  return ColorUrgencia.AMARILLO;
    return ColorUrgencia.VERDE;
  }

  private async persistirSnapshot(
    vehiculoId: number,
    kmDia: KmDiaResultado,
    masUrgente: PrediccionPlan | null,
  ): Promise<void> {
    await this.prediccionRepo.upsert(
      {
        vehiculo:       { id: vehiculoId } as any,
        kmPorDia:       kmDia.kmPorDia,
        diasEstimados:  masUrgente?.diasEstimados  ?? null,
        fechaEstimada:  masUrgente?.fechaEstimada  ?? null,
        planNombre:     masUrgente?.planNombre      ?? null,
        colorUrgencia:  masUrgente?.colorUrgencia   ?? ColorUrgencia.GRIS,
        mensaje:        kmDia.mensaje,
      },
      ['vehiculo'],
    );
  }

  private async generarAlertaSiCambia(
    vehiculoId: number,
    masUrgente: PrediccionPlan | null,
  ): Promise<void> {
    if (!masUrgente) return;

    // Solo genera alerta si el color es AMARILLO o ROJO
    if (
      masUrgente.colorUrgencia !== ColorUrgencia.AMARILLO &&
      masUrgente.colorUrgencia !== ColorUrgencia.ROJO
    ) return;

    // Verificar si ya existe alerta no leída de tipo mantenimiento_proximo o vencido
    const tipoAlerta =
      masUrgente.colorUrgencia === ColorUrgencia.ROJO
        ? TipoAlerta.MANTENIMIENTO_VENCIDO
        : TipoAlerta.MANTENIMIENTO_PROXIMO;

    const existente = await this.alertaRepo.findOne({
      where: {
        vehiculo:   { id: vehiculoId },
        plan:       { id: masUrgente.planId },
        tipoAlerta,
        leida:      false,
      },
    });

    if (existente) return;

    const mensaje =
      masUrgente.colorUrgencia === ColorUrgencia.ROJO
        ? `[Predicción] Mantenimiento "${masUrgente.planNombre}" ya vencido o estimado en los próximos días.`
        : `[Predicción] "${masUrgente.planNombre}" estimado en ${masUrgente.diasEstimados} días (${masUrgente.fechaEstimada}).`;

    await this.alertaRepo.save(
      this.alertaRepo.create({
        vehiculo:  { id: vehiculoId } as any,
        plan:      { id: masUrgente.planId } as any,
        documento: null,
        tipoAlerta,
        mensaje,
      }),
    );
  }
}
