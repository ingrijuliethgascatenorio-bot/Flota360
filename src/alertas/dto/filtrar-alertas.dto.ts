import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum FiltroAlerta {
  MANTENIMIENTO = 'mantenimiento',
  DOCUMENTO     = 'documento',
  TODAS         = 'todas',
}

export class FiltrarAlertasDto {
  @IsOptional()
  @IsEnum(FiltroAlerta)
  filtro?: FiltroAlerta = FiltroAlerta.TODAS;

  /** Por defecto solo devuelve las no leídas */
  @IsOptional()
  @Transform(({ value }) => value !== 'false')
  @IsBoolean()
  soloNoLeidas?: boolean = true;
}

export class UpdateUmbralesDto {
  @IsOptional()
  km?: number;

  @IsOptional()
  dias?: number;
}
