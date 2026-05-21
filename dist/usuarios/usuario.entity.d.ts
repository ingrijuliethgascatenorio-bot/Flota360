export declare enum RolUsuario {
    ADMINISTRADOR = "Administrador",
    TECNICO = "Tecnico",
    CONDUCTOR = "Conductor"
}
export declare class Usuario {
    id: number;
    nombre: string;
    correo: string;
    contrasenaHash: string;
    rol: RolUsuario;
    activo: boolean;
    intentosFallidos: number;
    bloqueadoHasta: Date | null;
    ultimoAcceso: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
