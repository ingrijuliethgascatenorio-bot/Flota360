import { PlanesService } from './planes.service';
import { CreatePlanDto } from './dto/create-plan.dto';
export declare class PlanesController {
    private readonly service;
    constructor(service: PlanesService);
    crear(vehiculoId: number, dto: CreatePlanDto): Promise<import("./plan-mantenimiento.entity").PlanMantenimiento>;
    listar(vehiculoId: number): Promise<import("./plan-mantenimiento.entity").PlanMantenimiento[]>;
    desactivar(id: number): Promise<void>;
}
