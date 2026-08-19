import { AlertasService } from '../alertas/alertas.service';
export declare class AlertasScheduler {
    private readonly alertasService;
    private readonly logger;
    constructor(alertasService: AlertasService);
    evaluarAlertasDiarias(): Promise<void>;
}
