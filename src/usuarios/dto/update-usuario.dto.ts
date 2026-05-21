import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../usuario.entity';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  contrasena?: string;

  @IsEnum(RolUsuario)
  @IsOptional()
  rol?: RolUsuario;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
