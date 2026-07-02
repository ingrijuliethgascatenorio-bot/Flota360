import { NovedadesService } from './novedades.service';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { AprobarNovedadDto, RechazarNovedadDto, FiltrarNovedadesDto } from './dto/aprobar-novedad.dto';
export declare class NovedadesController {
    private readonly service;
    constructor(service: NovedadesService);
    crear(req: any, dto: CreateNovedadDto): Promise<import("./entities/novedad.entity").Novedad>;
    misNovedades(req: any): Promise<import("./entities/novedad.entity").Novedad[]>;
    listar(filtros: FiltrarNovedadesDto): Promise<import("./entities/novedad.entity").Novedad[]>;
    buscar(id: number): Promise<import("./entities/novedad.entity").Novedad>;
    aprobar(id: number, dto: AprobarNovedadDto): Promise<import("./entities/novedad.entity").Novedad>;
    rechazar(id: number, dto: RechazarNovedadDto): Promise<import("./entities/novedad.entity").Novedad>;
}
