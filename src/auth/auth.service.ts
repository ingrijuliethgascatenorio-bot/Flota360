import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(correo: string, contrasena: string) {
    const usuario = await this.usuariosService.buscarPorCorreo(correo);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar si está bloqueado
    if (
      usuario.bloqueadoHasta &&
      new Date() < new Date(usuario.bloqueadoHasta)
    ) {
      const minutos = Math.ceil(
        (new Date(usuario.bloqueadoHasta).getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Cuenta bloqueada. Intenta de nuevo en ${minutos} minuto(s)`,
      );
    }

    const passwordValida = await bcrypt.compare(
      contrasena,
      usuario.contrasenaHash,
    );

    if (!passwordValida) {
      await this.usuariosService.incrementarIntentos(usuario.id);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Login exitoso: resetear intentos y registrar acceso
    await this.usuariosService.resetearIntentos(usuario.id);

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  async perfil(id: number) {
    return this.usuariosService.buscarPorId(id);
  }
}
