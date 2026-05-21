import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsuariosController {
    private readonly service;
    constructor(service: UsuariosService);
    crear(dto: CreateUsuarioDto): Promise<Omit<import("./usuario.entity").Usuario, "contrasenaHash">>;
    listar(): Promise<Omit<import("./usuario.entity").Usuario, "contrasenaHash">[]>;
    buscar(id: number): Promise<Omit<import("./usuario.entity").Usuario, "contrasenaHash">>;
    actualizar(id: number, dto: UpdateUsuarioDto): Promise<Omit<import("./usuario.entity").Usuario, "contrasenaHash">>;
    eliminar(id: number): Promise<void>;
}
