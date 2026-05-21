import {
  IsInt,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { TurnoAsignacion } from '../asignacion_conductor.entity';

export class CreateAsignacionDto {
  @IsInt()
  vehiculoId: number;

  @IsInt()
  conductorId: number;

  @IsEnum(TurnoAsignacion)
  turno: TurnoAsignacion;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
