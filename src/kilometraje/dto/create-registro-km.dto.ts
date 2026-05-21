import { IsEnum, IsInt, Min } from 'class-validator';
import { MomentoKm } from '../registro-km.entity';

export class CreateRegistroKmDto {
  @IsInt()
  @Min(0)
  kmValor: number;

  @IsEnum(MomentoKm, { message: 'momento debe ser: inicio o fin' })
  momento: MomentoKm;
}
