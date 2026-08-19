import { TipoCiclo } from '../plan-mantenimiento.entity';
export declare class CreatePlanDto {
    nombre: string;
    tipoCiclo: TipoCiclo;
    intervaloKm?: number;
    intervaloDias?: number;
}
