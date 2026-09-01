import { OrdenesService } from './ordenes.service';
export declare class ConductoresMantenimientosController {
    private readonly service;
    constructor(service: OrdenesService);
    misMantenimientos(req: any): Promise<any[]>;
    detalleMantenimiento(req: any, id: number): Promise<any>;
}
