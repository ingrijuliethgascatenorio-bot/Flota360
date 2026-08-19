import { DataSource } from 'typeorm';
import { FiltroReporteDto } from './dto/filtro-reporte.dto';
export interface MetricasReporte {
    costoTotal: number;
    costoPromedio: number;
    numIntervenciones: number;
}
export interface FilaReporteDetalle {
    ordenId: number;
    vehiculoId: number;
    placa: string;
    tecnicoId: number;
    tecnicoNombre: string;
    fechaApertura: string;
    fechaCierre: string | null;
    costoManoObra: number;
    costoRepuestos: number;
    costoTotal: number;
    repuestos: {
        nombreRepuesto: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
    }[];
    fotosTotal: number;
    descripcion: string | null;
}
export interface CostosPorVehiculo {
    vehiculoId: number;
    placa: string;
    marca: string;
    modelo: string;
    costoTotal: number;
    intervenciones: number;
}
export interface ReporteCostos {
    filtros: FiltroReporteDto;
    metricas: MetricasReporte;
    detalle: FilaReporteDetalle[];
    porVehiculo: CostosPorVehiculo[];
}
export declare class ReportesService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    reporteCostos(filtros: FiltroReporteDto): Promise<ReporteCostos>;
    private buildWhere;
}
