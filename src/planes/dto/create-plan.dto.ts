import {
  IsString, IsNotEmpty, IsEnum, IsInt,
  IsOptional, Min, ValidateIf,
} from 'class-validator';
import { TipoCiclo } from '../plan-mantenimiento.entity';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(TipoCiclo, { message: 'tipoCiclo debe ser: km, dias o combinado' })
  tipoCiclo: TipoCiclo;

  @ValidateIf(o => o.tipoCiclo === TipoCiclo.KM || o.tipoCiclo === TipoCiclo.COMBINADO)
  @IsInt()
  @Min(1)
  intervaloKm?: number;

  @ValidateIf(o => o.tipoCiclo === TipoCiclo.DIAS || o.tipoCiclo === TipoCiclo.COMBINADO)
  @IsInt()
  @Min(1)
  intervaloDias?: number;
}
