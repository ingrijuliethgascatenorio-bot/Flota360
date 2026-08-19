import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Usuario } from '../usuarios/usuario.entity';
export declare enum TurnoAsignacion {
    MANANA = "manana",
    TARDE = "tarde",
    NOCHE = "noche",
    COMPLETO = "completo"
}
export declare class AsignacionConductor {
    id: number;
    vehiculo: Vehiculo;
    conductor: Usuario;
    turno: TurnoAsignacion;
    fechaInicio: string;
    fechaFin: string | null;
    activo: boolean;
    observaciones: string | null;
    createdAt: Date;
    updatedAt: Date;
}
