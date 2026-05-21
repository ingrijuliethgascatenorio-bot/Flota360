import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
import { FotoOrden } from '../fotos/foto-orden.entity';
export declare enum EstadoOrden {
    ABIERTA = "Abierta",
    EN_PROCESO = "En proceso",
    CERRADA = "Cerrada",
    CANCELADA = "Cancelada"
}
export declare class OrdenTrabajo {
    id: number;
    vehiculo: Vehiculo;
    tecnico: Usuario;
    plan: PlanMantenimiento | null;
    fechaApertura: string;
    fechaCierre: string | null;
    descripcion: string | null;
    costoManoObra: number;
    costoTotal: number;
    estado: EstadoOrden;
    repuestos: RepuestoOrden[];
    fotos: FotoOrden[];
    createdAt: Date;
    updatedAt: Date;
}
