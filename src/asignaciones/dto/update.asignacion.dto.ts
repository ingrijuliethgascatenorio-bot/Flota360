import { PartialType } from '@nestjs/mapped-types';
import { CreateAsignacionDto } from './create.asignacion.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAsignacionDto extends PartialType(CreateAsignacionDto) {
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
