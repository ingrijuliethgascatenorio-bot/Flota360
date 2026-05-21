import { PartialType } from '@nestjs/mapped-types';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVehiculoDto extends PartialType(CreateVehiculoDto) {
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
