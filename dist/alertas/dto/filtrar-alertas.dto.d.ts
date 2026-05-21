export declare enum FiltroAlerta {
    MANTENIMIENTO = "mantenimiento",
    DOCUMENTO = "documento",
    TODAS = "todas"
}
export declare class FiltrarAlertasDto {
    filtro?: FiltroAlerta;
    soloNoLeidas?: boolean;
}
export declare class UpdateUmbralesDto {
    km?: number;
    dias?: number;
}
