import { AuthService } from './auth.service';
declare class LoginDto {
    correo: string;
    contrasena: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        usuario: {
            id: number;
            nombre: string;
            correo: string;
            rol: import("../usuarios/usuario.entity").RolUsuario;
        };
    }>;
    perfil(req: any): Promise<Omit<import("../usuarios/usuario.entity").Usuario, "contrasenaHash">>;
}
export {};
