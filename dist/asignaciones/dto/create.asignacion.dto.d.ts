import { TurnoAsignacion } from '../asignacion_conductor.entity';
export declare class CreateAsignacionDto {
    vehiculoId: number;
    conductorId: number;
    turno: TurnoAsignacion;
    fechaInicio: string;
    fechaFin?: string;
    observaciones?: string;
}
