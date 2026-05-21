/**
 * kilometraje-sprint4.hook.ts
 *
 * INSTRUCCIONES DE INTEGRACIÓN — Sprint 4
 * ─────────────────────────────────────────
 * En tu KilometrajeService existente (Sprint 2), después de guardar el
 * registro de km, añade la llamada al prediccionService:
 *
 *   void this.prediccionService.calcularPrediccion(registro.vehiculo.id);
 *
 * Esto recalcula km/día y fecha estimada cada vez que el conductor registra
 * un nuevo odómetro (RF-INN-01, RF-INN-02).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FRAGMENTO EXACTO A INSERTAR EN tu KilometrajeService existente
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // En el constructor, añadir:
 * private readonly prediccionService: PrediccionService,
 *
 * // Al final de registrarKm(), tras el save():
 * void this.prediccionService.calcularPrediccion(dto.vehiculoId);
 *
 * // El void hace que no bloquee la respuesta HTTP al conductor.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const KILOMETRAJE_SPRINT4_HOOK = 'ver comentario arriba';
