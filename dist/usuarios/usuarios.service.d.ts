import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsuariosService {
    private readonly repo;
    constructor(repo: Repository<Usuario>);
    crear(dto: CreateUsuarioDto): Promise<Omit<Usuario, 'contrasenaHash'>>;
    listar(): Promise<Omit<Usuario, 'contrasenaHash'>[]>;
    buscarPorId(id: number): Promise<Omit<Usuario, 'contrasenaHash'>>;
    buscarPorCorreo(correo: string): Promise<Usuario | null>;
    actualizar(id: number, dto: UpdateUsuarioDto): Promise<Omit<Usuario, 'contrasenaHash'>>;
    eliminar(id: number): Promise<void>;
    incrementarIntentos(id: number): Promise<void>;
    resetearIntentos(id: number): Promise<void>;
    private omitirHash;
}
