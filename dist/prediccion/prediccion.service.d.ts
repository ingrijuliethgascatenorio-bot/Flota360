import { Repository, DataSource } from 'typeorm';
import { PrediccionVehiculo, ColorUrgencia } from './prediccion-vehiculo.entity';
import { Alerta } from '../alertas/alerta.entity';
export interface KmDiaResultado {
    vehiculoId: number;
    kmPorDia: number | null;
    registros: number;
    suficiente: boolean;
    mensaje: string | null;
}
export interface PrediccionPlan {
    planId: number;
    planNombre: string;
    kmRestantes: number | null;
    diasEstimados: number | null;
    fechaEstimada: string | null;
    colorUrgencia: ColorUrgencia;
}
export interface PrediccionCompleta {
    vehiculoId: number;
    placa: string;
    kmPorDia: number | null;
    suficiente: boolean;
    mensaje: string | null;
    diasEstimados: number | null;
    fechaEstimada: string | null;
    colorUrgencia: ColorUrgencia;
    predicciones: PrediccionPlan[];
    calculadoEn: Date;
}
export declare class PrediccionService {
    private readonly prediccionRepo;
    private readonly alertaRepo;
    private readonly dataSource;
    private readonly logger;
    constructor(prediccionRepo: Repository<PrediccionVehiculo>, alertaRepo: Repository<Alerta>, dataSource: DataSource);
    calcularKmDia(vehiculoId: number): Promise<KmDiaResultado>;
    calcularPrediccion(vehiculoId: number): Promise<PrediccionCompleta>;
    getSnapshotVehiculo(vehiculoId: number): Promise<PrediccionVehiculo | null>;
    getSnapshotFlota(): Promise<PrediccionVehiculo[]>;
    private filtrarAnomalias;
    private colorPorDias;
    private persistirSnapshot;
    private generarAlertaSiCambia;
}
