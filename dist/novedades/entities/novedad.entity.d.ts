import { Vehiculo } from '../../vehiculos/vehiculo.entity';
import { Usuario } from '../../usuarios/usuario.entity';
import { OrdenTrabajo } from '../../ordenes/orden-trabajo.entity';
import { EstadoNovedad } from '../enums/estado-novedad.enum';
export declare class Novedad {
    id: number;
    vehiculo: Vehiculo;
    conductor: Usuario;
    tipoNovedad: string;
    descripcion: string;
    fechaReporte: Date;
    estado: EstadoNovedad;
    observacionAdmin: string | null;
    ordenTrabajo: OrdenTrabajo | null;
    createdAt: Date;
    updatedAt: Date;
}
