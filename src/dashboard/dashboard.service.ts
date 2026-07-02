import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PrediccionService } from '../prediccion/prediccion.service';
import { SaludFinancieraService } from '../salud-financiera/salud-financiera.service';
import { RolUsuario } from '../usuarios/usuario.entity';

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface TarjetaVehiculo {
  vehiculoId:       number;
  placa:            string;
  marca:            string;
  modelo:           string;
  anio:             number;
  estadoSemaforo:   'verde' | 'amarillo' | 'rojo';
  kmActual:         number;
  // Predicción (RF-INN-03)
  kmPorDia:         number | null;
  diasEstimados:    number | null;
  fechaEstimada:    string | null;
  colorPrediccion:  string;
  // Alertas activas
  alertasActivas:   number;
  alertasDetalle:   AlertaResumen[];
}

export interface AlertaResumen {
  id:         number;
  tipoAlerta: string;
  mensaje:    string;
  generadaEn: Date;
}

export interface DetalleSemaforoVehiculo {
  vehiculo:     TarjetaVehiculo;
  alertas:      AlertaResumen[];
  planes:       PlanResumen[];
  documentos:   DocumentoResumen[];
}

export interface PlanResumen {
  id:           number;
  nombre:       string;
  tipoCiclo:    string;
  kmProximo:    number | null;
  fechaProxima: string | null;
  kmRestantes:  number | null;
}

export interface DocumentoResumen {
  id:               number;
  tipo:             string;
  fechaVencimiento: string;
  vencido:          boolean;
  diasRestantes:    number;
}

export interface DashboardCompleto {
  totalVehiculos:   number;
  resumenSemaforo:  { verde: number; amarillo: number; rojo: number };
  vehiculos:        TarjetaVehiculo[];
  insights:         any;   // SaludFinanciera insights
}

const TIPOS_ALERTA_DOCUMENTO = [
  'documento_30dias',
  'documento_15dias',
  'documento_7dias',
  'documento_vencido',
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly prediccionService: PrediccionService,
    private readonly saludService: SaludFinancieraService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // RF-08 — Dashboard semáforo principal
  // ══════════════════════════════════════════════════════════════════════════

  async getDashboard(rolUsuario?: RolUsuario): Promise<DashboardCompleto> {
    const vehiculos: Array<{
      id: number; placa: string; marca: string; modelo: string;
      anio: number; km_actual: number; estado_semaforo: string;
    }> = await this.dataSource.query(
      `SELECT id, placa, marca, modelo, anio, km_actual, estado_semaforo
       FROM vehiculo
       WHERE activo = TRUE
       ORDER BY estado_semaforo DESC, placa ASC`,
    );

    const snapshots = await this.prediccionService.getSnapshotFlota();
    const snapshotMap = new Map(snapshots.map((s) => [s.vehiculo?.id, s]));

    const tarjetas: TarjetaVehiculo[] = await Promise.all(
      vehiculos.map((v) => this.buildTarjeta(v, snapshotMap.get(v.id) ?? null, rolUsuario)),
    );

    const resumen = { verde: 0, amarillo: 0, rojo: 0 };
    for (const t of tarjetas) resumen[t.estadoSemaforo]++;

    const insights = await this.saludService.getInsights();

    return {
      totalVehiculos: vehiculos.length,
      resumenSemaforo: resumen,
      vehiculos: tarjetas,
      insights,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RF-08 — Detalle de un vehículo (clic sobre semáforo)
  // ══════════════════════════════════════════════════════════════════════════

  async getDetalleVehiculo(
    vehiculoId: number,
    rolUsuario?: RolUsuario,
  ): Promise<DetalleSemaforoVehiculo> {
    const [vehiculo] = await this.dataSource.query(
      `SELECT id, placa, marca, modelo, anio, km_actual, estado_semaforo
       FROM vehiculo WHERE id = $1`,
      [vehiculoId],
    );

    // Forzar recálculo para asegurar sincronización (conductor -> admin)
    const prediccion = await this.prediccionService.calcularPrediccion(vehiculoId);
    const tarjeta    = await this.buildTarjeta(vehiculo, prediccion, rolUsuario);

    const filtroAlertas = this.filtroAlertasPorRol(rolUsuario);

    const alertas: AlertaResumen[] = await this.dataSource.query(
      `SELECT id, tipo_alerta AS "tipoAlerta", mensaje, generada_en AS "generadaEn"
       FROM alerta
       WHERE vehiculo_id = $1 AND leida = FALSE ${filtroAlertas.sql}
       ORDER BY generada_en DESC`,
      [vehiculoId, ...filtroAlertas.params],
    );

    const planesDb: PlanResumen[] = await this.dataSource.query(
      `SELECT id, nombre, tipo_ciclo AS "tipoCiclo",
              km_proximo AS "kmProximo",
              fecha_proxima::text AS "fechaProxima",
              CASE WHEN km_proximo IS NOT NULL
                   THEN km_proximo - (SELECT km_actual FROM vehiculo WHERE id = $1)
                   ELSE NULL
              END AS "kmRestantes"
       FROM plan_mantenimiento
       WHERE vehiculo_id = $1 AND activo = TRUE
       ORDER BY km_proximo ASC NULLS LAST`,
      [vehiculoId],
    );

    const snapshot = await this.prediccionService.getSnapshotVehiculo(vehiculoId);

    const planes: PlanResumen[] = planesDb.map(p => {
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
    const documentosRaw: Array<{
      id: number; tipo: string; fecha_vencimiento: string; vencido: boolean;
    }> = await this.dataSource.query(
      `SELECT id, tipo, fecha_vencimiento::text, vencido
       FROM documento_legal
       WHERE vehiculo_id = $1`,
      [vehiculoId],
    );

    const documentos: DocumentoResumen[] = documentosRaw.map((d) => ({
      id:               d.id,
      tipo:             d.tipo,
      fechaVencimiento: d.fecha_vencimiento,
      vencido:          d.vencido,
      diasRestantes:    Math.ceil(
        (new Date(d.fecha_vencimiento).getTime() - hoy.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));

    return { vehiculo: tarjeta, alertas, planes, documentos };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Helper privado — construir tarjeta de vehículo
  // ══════════════════════════════════════════════════════════════════════════

  private async buildTarjeta(
    v: { id: number; placa: string; marca: string; modelo: string; anio: number; km_actual: number; estado_semaforo: string },
    snapshot: any | null,
    rolUsuario?: RolUsuario,
  ): Promise<TarjetaVehiculo> {
    const filtroAlertas = this.filtroAlertasPorRol(rolUsuario);
    const alertas: AlertaResumen[] = await this.dataSource.query(
      `SELECT id, tipo_alerta AS "tipoAlerta", mensaje, generada_en AS "generadaEn"
       FROM alerta
       WHERE vehiculo_id = $1 AND leida = FALSE ${filtroAlertas.sql}
       ORDER BY generada_en DESC
       LIMIT 5`,
      [v.id, ...filtroAlertas.params],
    );

    return {
      vehiculoId:      v.id,
      placa:           v.placa,
      marca:           v.marca,
      modelo:          v.modelo,
      anio:            v.anio,
      estadoSemaforo:  v.estado_semaforo as 'verde' | 'amarillo' | 'rojo',
      kmActual:        v.km_actual,
      kmPorDia:        snapshot?.kmPorDia     ?? null,
      diasEstimados:   snapshot?.diasEstimados ?? null,
      fechaEstimada:   snapshot?.fechaEstimada ?? null,
      colorPrediccion: snapshot?.colorUrgencia ?? 'gris',
      alertasActivas:  alertas.length,
      alertasDetalle:  alertas,
    };
  }

  private filtroAlertasPorRol(rolUsuario?: RolUsuario): { sql: string; params: string[][] } {
    if (rolUsuario !== RolUsuario.TECNICO) {
      return { sql: '', params: [] };
    }

    return {
      sql: 'AND tipo_alerta <> ALL($2)',
      params: [TIPOS_ALERTA_DOCUMENTO],
    };
  }
}
