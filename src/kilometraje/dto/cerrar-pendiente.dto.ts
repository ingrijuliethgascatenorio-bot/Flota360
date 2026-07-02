import { IsInt, Min } from 'class-validator';

export class CerrarPendienteDto {
  @IsInt()
  @Min(0)
  kmFin: number;
}
