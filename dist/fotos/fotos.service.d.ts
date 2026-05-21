import { Repository, DataSource } from 'typeorm';
import { FotoOrden, TipoFoto } from './foto-orden.entity';
import { OrdenTrabajo, EstadoOrden } from '../ordenes/orden-trabajo.entity';
export interface ArchivoMulter {
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
}
export interface GaleriaOrden {
    antes: FotoOrden[];
    despues: FotoOrden[];
    total: number;
}
export interface GrupoFotosVehiculo {
    ordenId: number;
    fechaApertura: string;
    estado: EstadoOrden;
    tecnico: string;
    antes: Partial<FotoOrden>[];
    despues: Partial<FotoOrden>[];
}
export declare class FotosService {
    private readonly fotoRepo;
    private readonly ordenRepo;
    private readonly dataSource;
    constructor(fotoRepo: Repository<FotoOrden>, ordenRepo: Repository<OrdenTrabajo>, dataSource: DataSource);
    adjuntarFotos(ordenId: number, archivos: ArchivoMulter[], tipoFoto: TipoFoto, usuarioId: number): Promise<FotoOrden[]>;
    listarPorOrden(ordenId: number): Promise<GaleriaOrden>;
    historialPorVehiculo(vehiculoId: number): Promise<GrupoFotosVehiculo[]>;
    eliminar(fotoId: number, ordenId: number): Promise<{
        eliminado: boolean;
        fotoId: number;
    }>;
    private limpiarArchivos;
}
