import { OrdenesService } from './ordenes.service';
import { CreateOrdenDto, UpdateEstadoDto, UpdateCostosDto, RepuestoDto } from './dto/create-orden.dto';
export declare class OrdenesController {
    private readonly service;
    constructor(service: OrdenesService);
    crear(dto: CreateOrdenDto): Promise<import("./orden-trabajo.entity").OrdenTrabajo>;
    listar(vehiculoId?: string): Promise<import("./orden-trabajo.entity").OrdenTrabajo[]>;
    buscar(id: number): Promise<import("./orden-trabajo.entity").OrdenTrabajo>;
    cambiarEstado(id: number, dto: UpdateEstadoDto, req: any): Promise<import("./orden-trabajo.entity").OrdenTrabajo>;
    actualizarCostos(id: number, dto: UpdateCostosDto): Promise<import("./orden-trabajo.entity").OrdenTrabajo>;
    eliminar(id: number): Promise<{
        mensaje: string;
    }>;
    agregarRepuestos(id: number, repuestos: RepuestoDto[]): Promise<import("./orden-trabajo.entity").OrdenTrabajo>;
}
