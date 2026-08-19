import { OrdenTrabajo } from './orden-trabajo.entity';
export declare class RepuestoOrden {
    id: number;
    orden: OrdenTrabajo;
    nombreRepuesto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}
