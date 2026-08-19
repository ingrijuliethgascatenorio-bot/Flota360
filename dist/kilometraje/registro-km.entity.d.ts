import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Usuario } from '../usuarios/usuario.entity';
export declare enum MomentoKm {
    INICIO = "inicio",
    FIN = "fin"
}
export declare class RegistroKm {
    id: number;
    vehiculo: Vehiculo;
    conductor: Usuario;
    kmValor: number;
    momento: MomentoKm;
    registradoEn: Date;
}
