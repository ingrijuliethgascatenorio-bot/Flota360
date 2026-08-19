import { FotosService } from './fotos.service';
import { SubirFotosDto } from './dto/subir-fotos.dto';
export declare class FotosController {
    private readonly fotosService;
    constructor(fotosService: FotosService);
    adjuntarFotos(ordenId: number, dto: SubirFotosDto, archivos: Express.Multer.File[], req: any): Promise<{
        message: string;
        data: import("./foto-orden.entity").FotoOrden[];
    }>;
    listarFotosPorOrden(ordenId: number): Promise<{
        data: import("./fotos.service").GaleriaOrden;
    }>;
    eliminarFoto(ordenId: number, fotoId: number): Promise<{
        message: string;
        data: {
            eliminado: boolean;
            fotoId: number;
        };
    }>;
    historialFotosPorVehiculo(vehiculoId: number): Promise<{
        data: import("./fotos.service").GrupoFotosVehiculo[];
        total_ordenes: number;
    }>;
}
