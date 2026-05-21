import {
  Injectable, NotFoundException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, RolUsuario } from './usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async crear(dto: CreateUsuarioDto): Promise<Omit<Usuario, 'contrasenaHash'>> {
    const existe = await this.repo.findOne({ where: { correo: dto.correo } });
    if (existe) throw new ConflictException('Ya existe un usuario con ese correo');

    const hash = await bcrypt.hash(dto.contrasena, 12);
    const usuario = this.repo.create({
      nombre: dto.nombre,
      correo: dto.correo,
      contrasenaHash: hash,
      rol: dto.rol,
    });

    const guardado = await this.repo.save(usuario);
    return this.omitirHash(guardado);
  }

  async listar(): Promise<Omit<Usuario, 'contrasenaHash'>[]> {
    const usuarios = await this.repo.find({ order: { createdAt: 'DESC' } });
    return usuarios.map(this.omitirHash);
  }

  async buscarPorId(id: number): Promise<Omit<Usuario, 'contrasenaHash'>> {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return this.omitirHash(usuario);
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.repo.findOne({ where: { correo } });
  }

  async actualizar(
    id: number,
    dto: UpdateUsuarioDto,
  ): Promise<Omit<Usuario, 'contrasenaHash'>> {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);

    if (dto.contrasena) {
      usuario.contrasenaHash = await bcrypt.hash(dto.contrasena, 12);
    }
    if (dto.nombre)  usuario.nombre = dto.nombre;
    if (dto.rol)     usuario.rol    = dto.rol;
    if (dto.activo !== undefined) usuario.activo = dto.activo;

    const actualizado = await this.repo.save(usuario);
    return this.omitirHash(actualizado);
  }

  async eliminar(id: number): Promise<void> {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);
    await this.repo.remove(usuario);
  }

  async incrementarIntentos(id: number): Promise<void> {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) return;

    usuario.intentosFallidos += 1;
    if (usuario.intentosFallidos >= 5) {
      const bloqueo = new Date();
      bloqueo.setMinutes(bloqueo.getMinutes() + 10);
      usuario.bloqueadoHasta = bloqueo;
      usuario.intentosFallidos = 0;
    }
    await this.repo.save(usuario);
  }

  async resetearIntentos(id: number): Promise<void> {
    await this.repo.update(id, {
      intentosFallidos: 0,
      bloqueadoHasta: null,
      ultimoAcceso: new Date(),
    });
  }

  private omitirHash(u: Usuario): Omit<Usuario, 'contrasenaHash'> {
    const { contrasenaHash, ...resto } = u;
    return resto as Omit<Usuario, 'contrasenaHash'>;
  }
}
