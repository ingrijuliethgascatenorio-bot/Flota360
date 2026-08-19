import { PrediccionService } from './prediccion.service';
export declare class PrediccionController {
    private readonly prediccionService;
    constructor(prediccionService: PrediccionService);
    snapshotFlota(): Promise<{
        data: import("./prediccion-vehiculo.entity").PrediccionVehiculo[];
        total: number;
    }>;
    snapshotVehiculo(vehiculoId: number): Promise<{
        data: import("./prediccion-vehiculo.entity").PrediccionVehiculo | null;
    }>;
    recalcular(vehiculoId: number): Promise<{
        message: string;
        data: import("./prediccion.service").PrediccionCompleta;
    }>;
}
