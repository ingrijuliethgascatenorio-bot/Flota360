export declare class RepuestoDto {
    nombreRepuesto: string;
    cantidad: number;
    precioUnitario: number;
}
export declare class CreateOrdenDto {
    vehiculoId: number;
    tecnicoId: number;
    planId?: number;
    descripcion?: string;
    costoManoObra: number;
    repuestos?: RepuestoDto[];
}
export declare class UpdateEstadoDto {
    estado: string;
}
export declare class UpdateCostosDto {
    costoManoObra: number;
    descripcion?: string;
    repuestos?: RepuestoDto[];
}
