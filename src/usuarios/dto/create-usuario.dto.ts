import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { RolUsuario } from '../usuario.entity';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsEmail({}, { message: 'Correo inválido' })
  correo: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  contrasena: string;

  @IsEnum(RolUsuario, { message: 'Rol inválido' })
  rol: RolUsuario;
}
