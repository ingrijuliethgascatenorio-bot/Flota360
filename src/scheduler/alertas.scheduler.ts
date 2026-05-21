import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertasService } from '../alertas/alertas.service';

@Injectable()
export class AlertasScheduler {
  private readonly logger = new Logger(AlertasScheduler.name);

  constructor(private readonly alertasService: AlertasService) {}

  /**
   * RF-05, RF-06 — Evaluación diaria a las 06:00 (hora Colombia)
   * Recorre todos los vehículos activos y genera alertas si corresponde.
   */
  @Cron('0 6 * * *', { timeZone: 'America/Bogota' })
  async evaluarAlertasDiarias(): Promise<void> {
    const inicio = Date.now();
    this.logger.log(`Iniciando evaluación diaria de alertas — ${new Date().toISOString()}`);

    try {
      const resultados = await this.alertasService.ejecutarEvaluacionGlobal();
      const totalGeneradas = resultados.reduce((acc, r) => acc + r.generadas, 0);

      this.logger.log(
        `Evaluación completada en ${Date.now() - inicio} ms. ` +
        `Vehículos procesados: ${resultados.length}. ` +
        `Alertas generadas: ${totalGeneradas}.`,
      );
    } catch (err) {
      this.logger.error('Error crítico en evaluación de alertas:', err);
    }
  }
}
