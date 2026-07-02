import { Repository } from 'typeorm';
import { Novedad } from './entities/novedad.entity';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { AprobarNovedadDto, RechazarNovedadDto, FiltrarNovedadesDto } from './dto/aprobar-novedad.dto';
import { AsignacionesService } from '../asignaciones/asignaciones.service';
import { OrdenesService } from '../ordenes/ordenes.service';
export declare class NovedadesService {
    private readonly repo;
    private readonly asignacionesService;
    private readonly ordenesService;
    constructor(repo: Repository<Novedad>, asignacionesService: AsignacionesService, ordenesService: OrdenesService);
    crear(conductorId: number, dto: CreateNovedadDto): Promise<Novedad>;
    misNovedades(conductorId: number): Promise<Novedad[]>;
    listar(filtros: FiltrarNovedadesDto): Promise<Novedad[]>;
    buscarPorId(id: number): Promise<Novedad>;
    aprobar(id: number, dto: AprobarNovedadDto): Promise<Novedad>;
    rechazar(id: number, dto: RechazarNovedadDto): Promise<Novedad>;
    private generarDescripcionOT;
}
