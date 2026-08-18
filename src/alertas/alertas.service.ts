import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Alerta, TipoAlerta } from './alerta.entity';
import { Configuracion } from '../configuracion/configuracion.entity';
import { Vehiculo, EstadoSemaforo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento, TipoCiclo } from '../planes/plan-mantenimiento.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { RolUsuario } from '../usuarios/usuario.entity';

// ─── Umbrales por defecto (RF-05) ─────────────────────────────────────────────
const DEFAULT_UMBRAL_KM = 500;
const DEFAULT_UMBRAL_DIAS = 7;

// ─── Días de anticipación para documentos (RF-06) ────────────────────────────
const DOC_DIAS_ALERTA = [30, 15, 7] as const;
const TIPOS_ALERTA_DOCUMENTO = [
  TipoAlerta.DOCUMENTO_30DIAS,
  TipoAlerta.DOCUMENTO_15DIAS,
  TipoAlerta.DOCUMENTO_7DIAS,
  TipoAlerta.DOCUMENTO_VENCIDO,
];

export interface Umbrales {
  km: number;
  dias: number;
}

export interface ResumenCron {
  vehiculoId: number;
  generadas: number;
}

@Injectable()
export class AlertasService implements OnModuleInit {
  private readonly logger = new Logger(AlertasService.name);
  constructor(
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,

    @InjectRepository(Configuracion)
    private readonly configRepo: Repository<Configuracion>,

    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,

    @InjectRepository(PlanMantenimiento)
    private readonly planRepo: Repository<PlanMantenimiento>,

    @InjectRepository(DocumentoLegal)
    private readonly documentoRepo: Repository<DocumentoLegal>,
  ) { }

  async onModuleInit() {
    this.logger.log('Ejecutando evaluación global de alertas en el arranque...');
    try {
      const resultados = await this.ejecutarEvaluacionGlobal();
      const totalGeneradas = resultados.reduce((acc, r) => acc + r.generadas, 0);
      this.logger.log(`Evaluación completada. Alertas generadas: ${totalGeneradas}`);
    } catch (error) {
      this.logger.error('Error al evaluar alertas en el arranque:', error);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Umbrales configurables (RF-05)
  // ══════════════════════════════════════════════════════════════════════════

  async getUmbrales(): Promise<Umbrales> {
    const filas = await this.configRepo.findBy({ clave: In(['umbral_km', 'umbral_dias']) });
    const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valorEntero]));
    return {
      km: mapa['umbral_km'] ?? DEFAULT_UMBRAL_KM,
      dias: mapa['umbral_dias'] ?? DEFAULT_UMBRAL_DIAS,
    };
  }

  async actualizarUmbrales(km?: number, dias?: number): Promise<Umbrales> {
    if (km !== undefined) {
      if (km <= 0) throw new BadRequestException('El umbral de km debe ser un número positivo.');
      await this.configRepo.upsert(
        { clave: 'umbral_km', valorEntero: km },
        ['clave'],
      );
    }
    if (dias !== undefined) {
      if (dias <= 0) throw new BadRequestException('El umbral de días debe ser un número positivo.');
      await this.configRepo.upsert(
        { clave: 'umbral_dias', valorEntero: dias },
        ['clave'],
      );
    }
    return this.getUmbrales();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RF-05 — Alertas de mantenimiento
  // ══════════════════════════════════════════════════════════════════════════

  async evaluarAlertasMantenimiento(vehiculoId: number): Promise<Alerta[]> {
    const vehiculo = await this.vehiculoRepo.findOne({ where: { id: vehiculoId } });
    if (!vehiculo) {
      throw new NotFoundException(`El vehículo #${vehiculoId} no existe`);
    }

    const { km: umbralKm, dias: umbralDias } = await this.getUmbrales();
    const hoy = new Date();

    const planes = await this.planRepo.find({
      where: { vehiculo: { id: vehiculoId }, activo: true },
      relations: ['vehiculo'],
    });

    if (planes.length === 0) {
      throw new BadRequestException(
        `El vehículo #${vehiculoId} no tiene ningún plan de mantenimiento activo para evaluar.`,
      );
    }

    const generadas: Alerta[] = [];

    for (const plan of planes) {
      const tipoAlerta = this.calcularTipoAlertaMantenimiento(
        plan,
        plan.vehiculo.kmActual,
        hoy,
        umbralKm,
        umbralDias,
      );
      if (!tipoAlerta) continue;

      // Evitar duplicados: no generar si ya existe una no leída del mismo tipo y plan
      const existe = await this.alertaRepo.findOne({
        where: { plan: { id: plan.id }, tipoAlerta, leida: false },
      });
      if (existe) continue;

      const mensaje = this.buildMensajeMantenimiento(plan, tipoAlerta, plan.vehiculo.kmActual, hoy);
      const alerta = await this.alertaRepo.save(
        this.alertaRepo.create({
          vehiculo: { id: vehiculoId } as Vehiculo,
          plan: { id: plan.id } as PlanMantenimiento,
          documento: null,
          tipoAlerta,
          mensaje,
        }),
      );
      generadas.push(alerta);
    }

    await this.recalcularSemaforo(vehiculoId);
    return generadas;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RF-06 — Alertas de documentos legales (SOAT / RevisionTM)
  // ══════════════════════════════════════════════════════════════════════════

  async evaluarAlertasDocumentos(vehiculoId: number): Promise<Alerta[]> {
    const vehiculo = await this.vehiculoRepo.findOne({ where: { id: vehiculoId } });
    if (!vehiculo) {
      throw new NotFoundException(`El vehículo #${vehiculoId} no existe`);
    }
    const hoy = new Date();
    const documentos = await this.documentoRepo.findBy({ vehiculo: { id: vehiculoId } });
    const generadas: Alerta[] = [];

    for (const doc of documentos) {
      const diasRestantes = this.diasRestantes(new Date(doc.fechaVencimiento), hoy);
      const tipoAlerta = this.calcularTipoAlertaDocumento(diasRestantes);
      if (!tipoAlerta) continue;

      // Evitar duplicados
      const existe = await this.alertaRepo.findOne({
        where: { documento: { id: doc.id }, tipoAlerta, leida: false },
      });
      if (existe) continue;

      const mensaje = this.buildMensajeDocumento(doc.tipo, tipoAlerta, diasRestantes, doc.fechaVencimiento);
      const alerta = await this.alertaRepo.save(
        this.alertaRepo.create({
          vehiculo: { id: vehiculoId } as Vehiculo,
          plan: null,
          documento: { id: doc.id } as DocumentoLegal,
          tipoAlerta,
          mensaje,
        }),
      );

      // Marcar el documento como vencido
      if (tipoAlerta === TipoAlerta.DOCUMENTO_VENCIDO && !doc.vencido) {
        await this.documentoRepo.update(doc.id, { vencido: true });
      }

      generadas.push(alerta);
    }

    await this.recalcularSemaforo(vehiculoId);
    return generadas;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RF-06 — Limpiar alertas de un documento al renovarlo
  // ══════════════════════════════════════════════════════════════════════════

  async limpiarAlertasDocumento(documentoId: number): Promise<void> {
    const alertas = await this.alertaRepo.find({
      where: { documento: { id: documentoId }, leida: false },
      relations: ['vehiculo'],
    });

    if (alertas.length === 0) return;

    await this.alertaRepo.update(
      { documento: { id: documentoId }, leida: false },
      { leida: true },
    );

    const vehiculoId = alertas[0].vehiculo.id;
    await this.recalcularSemaforo(vehiculoId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Consulta y marcado de alertas
  // ══════════════════════════════════════════════════════════════════════════

  async listarAlertas(
    vehiculoId: number,
    filtro: 'mantenimiento' | 'documento' | 'todas' = 'todas',
    soloNoLeidas = true,
    rolUsuario?: RolUsuario,
  ): Promise<Alerta[]> {
    if (rolUsuario === RolUsuario.TECNICO && filtro === 'documento') {
      return [];
    }

    const qb = this.alertaRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.plan', 'pm')
      .leftJoinAndSelect('a.documento', 'dl')
      .where('a.vehiculo.id = :vehiculoId', { vehiculoId })
      .orderBy('a.generadaEn', 'DESC');

    if (soloNoLeidas) qb.andWhere('a.leida = false');

    if (rolUsuario === RolUsuario.TECNICO) {
      qb.andWhere('a.tipoAlerta NOT IN (:...tiposDocumento)', {
        tiposDocumento: TIPOS_ALERTA_DOCUMENTO,
      });
    }

    if (filtro === 'mantenimiento') {
      qb.andWhere('a.tipoAlerta IN (:...tipos)', {
        tipos: [TipoAlerta.MANTENIMIENTO_PROXIMO, TipoAlerta.MANTENIMIENTO_VENCIDO],
      });
    } else if (filtro === 'documento') {
      qb.andWhere('a.tipoAlerta IN (:...tipos)', {
        tipos: TIPOS_ALERTA_DOCUMENTO,
      });
    }

    return qb.getMany();
  }

  async marcarLeida(alertaId: number, vehiculoId: number): Promise<Alerta> {
    const alerta = await this.alertaRepo.findOne({
      where: { id: alertaId, vehiculo: { id: vehiculoId } },
    });

    if (!alerta) throw new NotFoundException(`Alerta #${alertaId} no encontrada`);

    alerta.leida = true;
    const guardada = await this.alertaRepo.save(alerta);
    await this.recalcularSemaforo(vehiculoId);
    return guardada;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Evaluación global (para el Scheduler)
  // ══════════════════════════════════════════════════════════════════════════

  async ejecutarEvaluacionGlobal(): Promise<ResumenCron[]> {
    const vehiculos = await this.vehiculoRepo.findBy({ activo: true });

    const resultados = await Promise.allSettled(
      vehiculos.map(async (v) => {
        const [mant, doc] = await Promise.all([
          this.evaluarAlertasMantenimiento(v.id),
          this.evaluarAlertasDocumentos(v.id),
        ]);
        return { vehiculoId: v.id, generadas: mant.length + doc.length };
      }),
    );

    return resultados
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<ResumenCron>).value);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers privados
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Recalcula y persiste el estado semáforo de un vehículo según sus alertas activas.
   * Rojo > Amarillo > Verde
   */
  private async recalcularSemaforo(vehiculoId: number): Promise<void> {
    const alertasActivas = await this.alertaRepo.find({
      where: { vehiculo: { id: vehiculoId }, leida: false },
      select: ['tipoAlerta'],
    });

    const tipos = new Set(alertasActivas.map((a) => a.tipoAlerta));

    let semaforo: EstadoSemaforo;

    if (
      tipos.has(TipoAlerta.MANTENIMIENTO_VENCIDO) ||
      tipos.has(TipoAlerta.DOCUMENTO_VENCIDO) ||
      tipos.has(TipoAlerta.DOCUMENTO_7DIAS)
    ) {
      semaforo = EstadoSemaforo.ROJO;
    } else if (
      tipos.has(TipoAlerta.MANTENIMIENTO_PROXIMO) ||
      tipos.has(TipoAlerta.DOCUMENTO_15DIAS) ||
      tipos.has(TipoAlerta.DOCUMENTO_30DIAS)
    ) {
      semaforo = EstadoSemaforo.AMARILLO;
    } else {
      semaforo = EstadoSemaforo.VERDE;
    }

    await this.vehiculoRepo.update(vehiculoId, { estadoSemaforo: semaforo });
  }

  private calcularTipoAlertaMantenimiento(
    plan: PlanMantenimiento,
    kmActual: number,
    hoy: Date,
    umbralKm: number,
    umbralDias: number,
  ): TipoAlerta | null {
    let tipoAlerta: TipoAlerta | null = null;

    // Evaluación por km
    if (
      [TipoCiclo.KM, TipoCiclo.COMBINADO].includes(plan.tipoCiclo) &&
      plan.kmProximo !== null
    ) {
      const kmRestantes = plan.kmProximo - kmActual;
      if (kmRestantes <= 0) {
        tipoAlerta = TipoAlerta.MANTENIMIENTO_VENCIDO;
      } else if (kmRestantes <= umbralKm) {
        tipoAlerta = TipoAlerta.MANTENIMIENTO_PROXIMO;
      }
    }

    // Evaluación por días (el vencido tiene prioridad)
    if (
      [TipoCiclo.DIAS, TipoCiclo.COMBINADO].includes(plan.tipoCiclo) &&
      plan.fechaProxima !== null
    ) {
      const diasRest = this.diasRestantes(new Date(plan.fechaProxima), hoy);
      if (diasRest <= 0) {
        tipoAlerta = TipoAlerta.MANTENIMIENTO_VENCIDO;
      } else if (diasRest <= umbralDias && tipoAlerta !== TipoAlerta.MANTENIMIENTO_VENCIDO) {
        tipoAlerta = TipoAlerta.MANTENIMIENTO_PROXIMO;
      }
    }

    return tipoAlerta;
  }

  private calcularTipoAlertaDocumento(diasRestantes: number): TipoAlerta | null {
    if (diasRestantes <= 0) return TipoAlerta.DOCUMENTO_VENCIDO;
    if (diasRestantes <= 7) return TipoAlerta.DOCUMENTO_7DIAS;
    if (diasRestantes <= 15) return TipoAlerta.DOCUMENTO_15DIAS;
    if (diasRestantes <= 30) return TipoAlerta.DOCUMENTO_30DIAS;
    return null;
  }

  private diasRestantes(fecha: Date, hoy: Date): number {
    // Normalizar ambas fechas a medianoche local (sin hora) para evitar
    // problemas de interpretación UTC en documentos tipo DATE
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.ceil((f.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
  }

  private buildMensajeMantenimiento(
    plan: PlanMantenimiento,
    tipo: TipoAlerta,
    kmActual: number,
    hoy: Date,
  ): string {
    if (tipo === TipoAlerta.MANTENIMIENTO_VENCIDO) {
      return `Mantenimiento vencido: "${plan.nombre}". Requiere intervención inmediata.`;
    }

    const partes: string[] = [];

    if ([TipoCiclo.KM, TipoCiclo.COMBINADO].includes(plan.tipoCiclo) && plan.kmProximo !== null) {
      partes.push(`${plan.kmProximo - kmActual} km restantes`);
    }

    if ([TipoCiclo.DIAS, TipoCiclo.COMBINADO].includes(plan.tipoCiclo) && plan.fechaProxima !== null) {
      const dias = this.diasRestantes(new Date(plan.fechaProxima), hoy);
      partes.push(`${dias} días restantes`);
    }

    return `Próximo mantenimiento: "${plan.nombre}" — ${partes.join(', ')}.`;
  }

  private buildMensajeDocumento(tipo: string, tipoAlerta: TipoAlerta, diasRestantes: number, fechaVencimiento: string): string {
    const nombre = tipo === 'SOAT' ? 'SOAT' : 'Revisión Técnico-Mecánica';
    const fecha = this.formatearFecha(fechaVencimiento);

    if (tipoAlerta === TipoAlerta.DOCUMENTO_VENCIDO) {
      return `${nombre} VENCIDO desde hace ${Math.abs(diasRestantes)} día(s). Vencimiento: ${fecha}.`;
    }
    return `${nombre} vence en ${diasRestantes} día(s) (${fecha}). Renueve a tiempo.`;
  }

  private formatearFecha(fechaStr: string): string {
    // Convierte "2024-05-07" a "07 de may de 2026"
    try {
      const fecha = new Date(fechaStr + 'T00:00:00');
      return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fechaStr;
    }
  }
}
