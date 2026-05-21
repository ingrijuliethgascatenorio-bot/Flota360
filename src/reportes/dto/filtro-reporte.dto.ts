import {
  IsOptional,
  IsInt,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltroReporteDto {
  /** ID del vehículo (opcional) */
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsInt()
  @IsPositive()
  vehiculoId?: number;

  /** ID del técnico (opcional) */
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsInt()
  @IsPositive()
  tecnicoId?: number;

  /** Fecha inicio YYYY-MM-DD */
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  /** Fecha fin YYYY-MM-DD */
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

export type PeriodoRanking = 'mes' | 'trimestre' | 'semestre' | 'anio';

export class FiltroRankingDto {
  @IsOptional()
  periodo?: PeriodoRanking;
}
