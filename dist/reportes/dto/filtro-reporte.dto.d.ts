export declare class FiltroReporteDto {
    vehiculoId?: number;
    tecnicoId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
}
export type PeriodoRanking = 'mes' | 'trimestre' | 'semestre' | 'anio';
export declare class FiltroRankingDto {
    periodo?: PeriodoRanking;
}
