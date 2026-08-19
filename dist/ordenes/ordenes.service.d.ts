import { Repository } from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
import { CreateOrdenDto, UpdateEstadoDto, UpdateCostosDto } from './dto/create-orden.dto';
import { PlanesService } from '../planes/planes.service';
import { RolUsuario } from '../usuarios/usuario.entity';
export declare class OrdenesService {
    private readonly ordenRepo;
    private readonly repuestoRepo;
    private readonly planesService;
    constructor(ordenRepo: Repository<OrdenTrabajo>, repuestoRepo: Repository<RepuestoOrden>, planesService: PlanesService);
    crear(dto: CreateOrdenDto): Promise<any>;
    buscarPorId(id: number): Promise<OrdenTrabajo>;
    listar(vehiculoId?: number): Promise<OrdenTrabajo[]>;
    cambiarEstado(id: number, dto: UpdateEstadoDto, rolUsuario: RolUsuario): Promise<OrdenTrabajo>;
    actualizarCostos(id: number, dto: UpdateCostosDto): Promise<OrdenTrabajo>;
    eliminar(id: number): Promise<{
        mensaje: string;
    }>;
    agregarRepuestos(ordenId: number, repuestos: {
        nombreRepuesto: string;
        cantidad: number;
        precioUnitario: number;
    }[]): Promise<OrdenTrabajo>;
    private sincronizarTotal;
}
