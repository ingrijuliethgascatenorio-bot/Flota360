import { Repository, DataSource } from 'typeorm';
import { SaludFinanciera } from './salud-financiera.entity';
import { PeriodoRanking } from '../reportes/dto/filtro-reporte.dto';
export interface InsightsDashboard {
    vehiculoMasCostoso: VehiculoMasCostoso | null;
    tecnicoMasActivo: TecnicoMasActivo | null;
    repuestoMasUsado: RepuestoMasUsado | null;
    periodo: string;
}
export interface VehiculoMasCostoso {
    vehiculoId: number;
    placa: string;
    marca: string;
    costoTotal: number;
    variacionPct: number | null;
}
export interface TecnicoMasActivo {
    tecnicoId: number;
    nombre: string;
    otCerradas: number;
}
export interface RepuestoMasUsado {
    nombre: string;
    cantidad: number;
}
export interface FilaRanking {
    posicion: number;
    vehiculoId: number;
    placa: string;
    marca: string;
    modelo: string;
    costoTotal: number;
    intervenciones: number;
    barraRelativa: number;
    codigoColor: 'rojo' | 'amarillo' | 'verde';
    nuevoTop: boolean;
}
export declare class SaludFinancieraService {
    private readonly saludRepo;
    private readonly dataSource;
    constructor(saludRepo: Repository<SaludFinanciera>, dataSource: DataSource);
    recalcularPorVehiculo(vehiculoId: number, periodo?: string): Promise<void>;
    getInsights(periodo?: string): Promise<InsightsDashboard>;
    getRanking(periodo?: PeriodoRanking): Promise<FilaRanking[]>;
    periodoActual(): string;
    private mesAnterior;
    private rangoFechas;
}
