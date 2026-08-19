import { OrdenTrabajo } from '../ordenes/orden-trabajo.entity';
import { Usuario } from '../usuarios/usuario.entity';
export declare enum TipoFoto {
    ANTES = "antes",
    DESPUES = "despues"
}
export declare class FotoOrden {
    id: number;
    orden: OrdenTrabajo;
    url: string;
    tipoFoto: TipoFoto;
    tamanoBytes: number;
    subidaPor: Usuario | null;
    tomadaEn: Date;
}
