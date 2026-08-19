import { Vehiculo } from '../vehiculos/vehiculo.entity';
export declare class SaludFinanciera {
    id: number;
    vehiculo: Vehiculo;
    periodo: string;
    costoTotal: number;
    costoPromedio: number;
    numIntervenciones: number;
    repuestoMasUsado: string | null;
    cantidadRepuesto: number | null;
    calculadoEn: Date;
}
