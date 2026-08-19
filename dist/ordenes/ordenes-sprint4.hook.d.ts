import { Repository } from 'typeorm';
import { OrdenTrabajo } from '../ordenes/orden-trabajo.entity';
import { SaludFinancieraService } from '../salud-financiera/salud-financiera.service';
import { PrediccionService } from '../prediccion/prediccion.service';
export declare class OrdenesHookService {
    private readonly ordenRepo;
    private readonly saludService;
    private readonly prediccionService;
    constructor(ordenRepo: Repository<OrdenTrabajo>, saludService: SaludFinancieraService, prediccionService: PrediccionService);
    onOrdenCerrada(ordenId: number): Promise<void>;
}
