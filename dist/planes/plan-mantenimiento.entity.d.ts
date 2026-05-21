import { Vehiculo } from '../vehiculos/vehiculo.entity';
export declare enum TipoCiclo {
    KM = "km",
    DIAS = "dias",
    COMBINADO = "combinado"
}
export declare class PlanMantenimiento {
    id: number;
    vehiculo: Vehiculo;
    nombre: string;
    tipoCiclo: TipoCiclo;
    intervaloKm: number | null;
    intervaloDias: number | null;
    kmProximo: number | null;
    fechaProxima: string | null;
    kmPorDia: number | null;
    fechaEstimada: string | null;
    colorUrgencia: string | null;
    prediccionActualizadaEn: Date | null;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}
