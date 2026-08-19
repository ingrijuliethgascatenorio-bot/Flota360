import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
export declare class VehiculosController {
    private readonly service;
    constructor(service: VehiculosService);
    crear(dto: CreateVehiculoDto): Promise<import("./vehiculo.entity").Vehiculo>;
    listar(): Promise<import("./vehiculo.entity").Vehiculo[]>;
    buscar(id: number): Promise<import("./vehiculo.entity").Vehiculo>;
    actualizar(id: number, dto: UpdateVehiculoDto): Promise<import("./vehiculo.entity").Vehiculo>;
    eliminar(id: number): Promise<void>;
}
