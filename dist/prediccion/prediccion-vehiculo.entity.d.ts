import { Vehiculo } from '../vehiculos/vehiculo.entity';
export declare enum ColorUrgencia {
    VERDE = "verde",
    AMARILLO = "amarillo",
    ROJO = "rojo",
    GRIS = "gris"
}
export declare class PrediccionVehiculo {
    id: number;
    vehiculo: Vehiculo;
    kmPorDia: number | null;
    diasEstimados: number | null;
    fechaEstimada: string | null;
    planNombre: string | null;
    colorUrgencia: ColorUrgencia;
    mensaje: string | null;
    calculadoEn: Date;
}
