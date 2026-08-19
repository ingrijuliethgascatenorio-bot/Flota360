import { AlertasService } from './alertas.service';
import { FiltrarAlertasDto, UpdateUmbralesDto } from './dto/filtrar-alertas.dto';
export declare class AlertasController {
    private readonly alertasService;
    constructor(alertasService: AlertasService);
    getUmbrales(): Promise<{
        data: import("./alertas.service").Umbrales;
    }>;
    updateUmbrales(dto: UpdateUmbralesDto): Promise<{
        message: string;
        data: import("./alertas.service").Umbrales;
    }>;
    listarAlertas(vehiculoId: number, filtrosDto: FiltrarAlertasDto, req: any): Promise<{
        data: import("./alerta.entity").Alerta[];
        total: number;
    }>;
    marcarLeida(vehiculoId: number, alertaId: number): Promise<{
        data: import("./alerta.entity").Alerta;
    }>;
    evaluarVehiculo(vehiculoId: number): Promise<{
        message: string;
        data: {
            alertas_mantenimiento: import("./alerta.entity").Alerta[];
            alertas_documentos: import("./alerta.entity").Alerta[];
            total_generadas: number;
        };
    }>;
}
