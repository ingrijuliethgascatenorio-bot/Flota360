import { EstadoNovedad } from '../enums/estado-novedad.enum';
export declare class AprobarNovedadDto {
    tecnicoId: number;
    observacion?: string;
}
export declare class RechazarNovedadDto {
    observacion?: string;
}
export declare class FiltrarNovedadesDto {
    estado?: EstadoNovedad;
    vehiculoId?: number;
    desde?: string;
    hasta?: string;
}
