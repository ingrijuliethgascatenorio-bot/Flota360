import { Repository } from 'typeorm';
import { PlanMantenimiento } from './plan-mantenimiento.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { Alerta } from '../alertas/alerta.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
export declare class PlanesService {
    private readonly repo;
    private readonly vehiculosService;
    private readonly alertaRepo;
    private readonly vehiculoRepo;
    constructor(repo: Repository<PlanMantenimiento>, vehiculosService: VehiculosService, alertaRepo: Repository<Alerta>, vehiculoRepo: Repository<Vehiculo>);
    crear(vehiculoId: number, dto: CreatePlanDto): Promise<PlanMantenimiento>;
    listarPorVehiculo(vehiculoId: number): Promise<PlanMantenimiento[]>;
    buscarPorId(id: number): Promise<PlanMantenimiento>;
    desactivar(id: number): Promise<void>;
    recalcularPrediccion(vehiculoId: number, kmPorDia: number | null): Promise<void>;
    reiniciarCiclo(planId: number, kmActual: number): Promise<void>;
    private recalcularSemaforo;
}
