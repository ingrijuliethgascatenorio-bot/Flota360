import { AsignacionesService } from './asignaciones.service';
import { CreateAsignacionDto } from './dto/create.asignacion.dto';
import { UpdateAsignacionDto } from './dto/update.asignacion.dto';
export declare class AsignacionesController {
    private readonly service;
    constructor(service: AsignacionesService);
    crear(dto: CreateAsignacionDto): Promise<import("./asignacion_conductor.entity").AsignacionConductor>;
    listarActivas(): Promise<import("./asignacion_conductor.entity").AsignacionConductor[]>;
    porVehiculo(id: number): Promise<import("./asignacion_conductor.entity").AsignacionConductor[]>;
    historial(id: number): Promise<import("./asignacion_conductor.entity").AsignacionConductor[]>;
    porConductor(id: number): Promise<import("./asignacion_conductor.entity").AsignacionConductor[]>;
    todasPorConductor(id: number): Promise<import("./asignacion_conductor.entity").AsignacionConductor[]>;
    desactivar(id: number): Promise<import("./asignacion_conductor.entity").AsignacionConductor>;
    buscarPorId(id: number): Promise<import("./asignacion_conductor.entity").AsignacionConductor>;
    actualizar(id: number, dto: UpdateAsignacionDto): Promise<import("./asignacion_conductor.entity").AsignacionConductor>;
}
