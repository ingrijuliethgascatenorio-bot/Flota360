import { RolUsuario } from '../usuario.entity';
export declare class UpdateUsuarioDto {
    nombre?: string;
    contrasena?: string;
    rol?: RolUsuario;
    activo?: boolean;
}
