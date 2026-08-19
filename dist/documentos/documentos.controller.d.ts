import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
export declare class DocumentosController {
    private readonly service;
    constructor(service: DocumentosService);
    crear(vehiculoId: number, dto: CreateDocumentoDto): Promise<import("./documento-legal.entity").DocumentoLegal>;
    listar(vehiculoId: number): Promise<import("./documento-legal.entity").DocumentoLegal[]>;
    actualizar(vehiculoId: number, tipo: string, dto: Partial<CreateDocumentoDto>): Promise<import("./documento-legal.entity").DocumentoLegal>;
}
