import { KilometrajeService } from './kilometraje.service';
import { CreateRegistroKmDto } from './dto/create-registro-km.dto';
export declare class KilometrajeController {
    private readonly service;
    constructor(service: KilometrajeService);
    registrar(vehiculoId: number, req: any, dto: CreateRegistroKmDto): Promise<import("./registro-km.entity").RegistroKm>;
    historial(vehiculoId: number): Promise<import("./registro-km.entity").RegistroKm[]>;
    kmPorDia(vehiculoId: number): Promise<import("../prediccion/prediccion.service").KmDiaResultado>;
    kmInicioEncadenado(vehiculoId: number, req: any): Promise<{
        kmSugerido: number;
        encadenado: boolean;
        turno: string;
        mensaje: string;
    }>;
}
