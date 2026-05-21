import { Vehiculo } from '../vehiculos/vehiculo.entity';
export declare enum TipoDocumento {
    SOAT = "SOAT",
    REVISION_TM = "RevisionTM"
}
export declare class DocumentoLegal {
    id: number;
    vehiculo: Vehiculo;
    tipo: TipoDocumento;
    fechaVencimiento: string;
    archivoUrl: string | null;
    vencido: boolean;
    createdAt: Date;
    updatedAt: Date;
}
