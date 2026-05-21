/**
 * ordenes-sprint4.hook.ts
 *
 * INSTRUCCIONES DE INTEGRACIÓN — Sprint 4
 * ─────────────────────────────────────────
 * En tu OrdenesService existente (Sprint 2), cuando la orden cambia a estado
 * 'Cerrada', añade estas dos llamadas:
 *
 *   1. this.saludService.recalcularPorVehiculo(orden.vehiculo.id)
 *   2. this.prediccionService.calcularPrediccion(orden.vehiculo.id)
 *
 * Ejemplo de integración en el método cerrarOrden() o actualizarEstado():
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenTrabajo, EstadoOrden } from '../ordenes/orden-trabajo.entity';
import { SaludFinancieraService } from '../salud-financiera/salud-financiera.service';
import { PrediccionService } from '../prediccion/prediccion.service';

@Injectable()
export class OrdenesHookService {
  constructor(
    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepo: Repository<OrdenTrabajo>,

    private readonly saludService: SaludFinancieraService,
    private readonly prediccionService: PrediccionService,
  ) {}

  /**
   * Llamar desde OrdenesService.actualizarEstado() cuando estado = 'Cerrada'.
   * Lanza ambos recálculos en paralelo sin bloquear la respuesta HTTP.
   */
  async onOrdenCerrada(ordenId: number): Promise<void> {
    const orden = await this.ordenRepo.findOne({
      where:    { id: ordenId, estado: EstadoOrden.CERRADA },
      relations: ['vehiculo'],
    });

    if (!orden) return;

    // Ejecutar en paralelo, sin lanzar excepciones al cliente
    await Promise.allSettled([
      this.saludService.recalcularPorVehiculo(orden.vehiculo.id),
      this.prediccionService.calcularPrediccion(orden.vehiculo.id),
    ]);
  }
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FRAGMENTO EXACTO A INSERTAR EN tu OrdenesService existente
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // En el constructor:
 * constructor(
 *   ...existing deps...
 *   private readonly saludService: SaludFinancieraService,
 *   private readonly prediccionService: PrediccionService,
 * ) {}
 *
 * // Al final de cerrarOrden() o dentro de actualizarEstado(), tras el save():
 * if (orden.estado === EstadoOrden.CERRADA) {
 *   void Promise.allSettled([
 *     this.saludService.recalcularPorVehiculo(orden.vehiculo.id),
 *     this.prediccionService.calcularPrediccion(orden.vehiculo.id),
 *   ]);
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */
