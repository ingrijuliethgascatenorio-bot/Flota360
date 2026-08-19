import { Repository } from 'typeorm';
import { DocumentoLegal } from './documento-legal.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { AlertasService } from '../alertas/alertas.service';
export declare class DocumentosService {
    private readonly repo;
    private readonly vehiculosService;
    private readonly alertasService;
    constructor(repo: Repository<DocumentoLegal>, vehiculosService: VehiculosService, alertasService: AlertasService);
    crear(vehiculoId: number, dto: CreateDocumentoDto): Promise<DocumentoLegal>;
    listarPorVehiculo(vehiculoId: number): Promise<DocumentoLegal[]>;
    actualizar(vehiculoId: number, tipo: string, dto: Partial<CreateDocumentoDto>): Promise<DocumentoLegal>;
}
