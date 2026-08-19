import { TipoDocumento } from '../documento-legal.entity';
export declare class CreateDocumentoDto {
    tipo: TipoDocumento;
    fechaVencimiento: string;
    archivoUrl?: string;
}
