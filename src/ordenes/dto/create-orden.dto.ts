import {
  IsInt, IsOptional, IsString, IsNumber, Min, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RepuestoDto {
  @IsString()
  nombreRepuesto: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class CreateOrdenDto {
  @IsInt()
  vehiculoId: number;

  @IsInt()
  tecnicoId: number;

  @IsOptional()
  @IsInt()
  planId?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  costoManoObra: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepuestoDto)
  repuestos?: RepuestoDto[];
}

export class UpdateEstadoDto {
  @IsString()
  estado: string;
}

export class UpdateCostosDto {
  @IsNumber()
  @Min(0)
  costoManoObra: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepuestoDto)
  repuestos?: RepuestoDto[];
}
