import { Repository } from 'typeorm';
import { RegistroKm } from './registro-km.entity';
import { CreateRegistroKmDto } from './dto/create-registro-km.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PlanesService } from '../planes/planes.service';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { PrediccionService } from '../prediccion/prediccion.service';
export declare class KilometrajeService {
    private readonly repo;
    private readonly asignRepo;
    private readonly vehiculosService;
    private readonly usuariosService;
    private readonly planesService;
    private readonly prediccionService;
    constructor(repo: Repository<RegistroKm>, asignRepo: Repository<AsignacionConductor>, vehiculosService: VehiculosService, usuariosService: UsuariosService, planesService: PlanesService, prediccionService: PrediccionService);
    registrar(vehiculoId: number, conductorId: number, dto: CreateRegistroKmDto): Promise<RegistroKm>;
    private finalizarAsignacionActiva;
    historial(vehiculoId: number): Promise<RegistroKm[]>;
    kmInicioEncadenado(vehiculoId: number, conductorId: number): Promise<{
        kmSugerido: number;
        encadenado: boolean;
        turno: string;
        mensaje: string;
    }>;
    calcularKmPorDia(vehiculoId: number): Promise<import("../prediccion/prediccion.service").KmDiaResultado>;
}
