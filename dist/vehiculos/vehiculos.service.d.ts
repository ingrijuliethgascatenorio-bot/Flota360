import { Repository } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { AlertasService } from '../alertas/alertas.service';
export declare class VehiculosService {
    private readonly repo;
    private readonly documentoRepo;
    private readonly alertasService;
    constructor(repo: Repository<Vehiculo>, documentoRepo: Repository<DocumentoLegal>, alertasService: AlertasService);
    crear(dto: CreateVehiculoDto): Promise<Vehiculo>;
    listar(): Promise<Vehiculo[]>;
    buscarPorId(id: number): Promise<Vehiculo>;
    actualizar(id: number, dto: UpdateVehiculoDto): Promise<Vehiculo>;
    eliminar(id: number): Promise<void>;
}
