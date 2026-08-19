import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
export declare enum TipoAlerta {
    MANTENIMIENTO_PROXIMO = "mantenimiento_proximo",
    MANTENIMIENTO_VENCIDO = "mantenimiento_vencido",
    DOCUMENTO_30DIAS = "documento_30dias",
    DOCUMENTO_15DIAS = "documento_15dias",
    DOCUMENTO_7DIAS = "documento_7dias",
    DOCUMENTO_VENCIDO = "documento_vencido",
    ORDEN_NUEVA = "orden_nueva"
}
export declare class Alerta {
    id: number;
    vehiculo: Vehiculo;
    plan: PlanMantenimiento | null;
    documento: DocumentoLegal | null;
    tipoAlerta: TipoAlerta;
    mensaje: string;
    leida: boolean;
    generadaEn: Date;
}
