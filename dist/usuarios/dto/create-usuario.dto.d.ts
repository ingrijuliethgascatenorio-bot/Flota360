import { RolUsuario } from '../usuario.entity';
export declare class CreateUsuarioDto {
    nombre: string;
    correo: string;
    contrasena: string;
    rol: RolUsuario;
}
