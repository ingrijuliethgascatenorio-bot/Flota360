import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoNovedad } from '../enums/estado-novedad.enum';

export class AprobarNovedadDto {
  @IsInt()
  tecnicoId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;
}

export class RechazarNovedadDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;
}

export class FiltrarNovedadesDto {
  @IsOptional()
  @IsString()
  estado?: EstadoNovedad;

  @IsOptional()
  vehiculoId?: number;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;
}