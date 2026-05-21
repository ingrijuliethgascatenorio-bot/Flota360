import { Repository } from 'typeorm';
import { AsignacionConductor } from './asignacion_conductor.entity';
import { CreateAsignacionDto } from './dto/create.asignacion.dto';
import { UpdateAsignacionDto } from './dto/update.asignacion.dto';
export declare class AsignacionesService {
    private readonly repo;
    constructor(repo: Repository<AsignacionConductor>);
    crear(dto: CreateAsignacionDto): Promise<AsignacionConductor>;
    listarActivas(): Promise<AsignacionConductor[]>;
    porVehiculo(vehiculoId: number): Promise<AsignacionConductor[]>;
    porConductor(conductorId: number): Promise<AsignacionConductor[]>;
    desactivar(id: number): Promise<AsignacionConductor>;
    historialVehiculo(vehiculoId: number): Promise<AsignacionConductor[]>;
    buscarPorId(id: number): Promise<AsignacionConductor>;
    actualizar(id: number, dto: UpdateAsignacionDto): Promise<AsignacionConductor>;
}
