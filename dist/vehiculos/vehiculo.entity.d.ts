import { DocumentoLegal } from '../documentos/documento-legal.entity';
export declare enum EstadoSemaforo {
    VERDE = "verde",
    AMARILLO = "amarillo",
    ROJO = "rojo"
}
export declare class Vehiculo {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    kmActual: number;
    capacidad: number;
    numMotor: string;
    numChasis: string;
    fotoUrl: string | null;
    estadoSemaforo: EstadoSemaforo;
    activo: boolean;
    documentos: DocumentoLegal[];
    createdAt: Date;
    updatedAt: Date;
}
