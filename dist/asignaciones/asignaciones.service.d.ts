import { Repository } from 'typeorm';
import { AsignacionConductor } from './asignacion_conductor.entity';
import { CreateAsignacionDto } from './dto/create.asignacion.dto';
import { UpdateAsignacionDto } from './dto/update.asignacion.dto';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
export declare class AsignacionesService {
    private readonly repo;
    private readonly docRepo;
    private readonly vehiculoRepo;
    private readonly planRepo;
    constructor(repo: Repository<AsignacionConductor>, docRepo: Repository<DocumentoLegal>, vehiculoRepo: Repository<Vehiculo>, planRepo: Repository<PlanMantenimiento>);
    private validarVehiculoParaAsignar;
    crear(dto: CreateAsignacionDto): Promise<AsignacionConductor>;
    listarActivas(): Promise<AsignacionConductor[]>;
    porVehiculo(vehiculoId: number): Promise<AsignacionConductor[]>;
    porConductor(conductorId: number): Promise<AsignacionConductor[]>;
    desactivar(id: number): Promise<AsignacionConductor>;
    historialVehiculo(vehiculoId: number): Promise<AsignacionConductor[]>;
    buscarPorId(id: number): Promise<AsignacionConductor>;
    actualizar(id: number, dto: UpdateAsignacionDto): Promise<AsignacionConductor>;
    todasPorConductor(conductorId: number): Promise<AsignacionConductor[]>;
}
