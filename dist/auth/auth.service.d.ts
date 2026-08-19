import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
export declare class AuthService {
    private readonly usuariosService;
    private readonly jwtService;
    constructor(usuariosService: UsuariosService, jwtService: JwtService);
    login(correo: string, contrasena: string): Promise<{
        accessToken: string;
        usuario: {
            id: number;
            nombre: string;
            correo: string;
            rol: import("../usuarios/usuario.entity").RolUsuario;
        };
    }>;
    perfil(id: number): Promise<Omit<import("../usuarios/usuario.entity").Usuario, "contrasenaHash">>;
}
