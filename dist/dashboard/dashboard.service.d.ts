import { DataSource } from 'typeorm';
import { PrediccionService } from '../prediccion/prediccion.service';
import { SaludFinancieraService } from '../salud-financiera/salud-financiera.service';
import { RolUsuario } from '../usuarios/usuario.entity';
export interface TarjetaVehiculo {
    vehiculoId: number;
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    estadoSemaforo: 'verde' | 'amarillo' | 'rojo';
    kmActual: number;
    kmPorDia: number | null;
    diasEstimados: number | null;
    fechaEstimada: string | null;
    colorPrediccion: string;
    alertasActivas: number;
    alertasDetalle: AlertaResumen[];
}
export interface AlertaResumen {
    id: number;
    tipoAlerta: string;
    mensaje: string;
    generadaEn: Date;
}
export interface DetalleSemaforoVehiculo {
    vehiculo: TarjetaVehiculo;
    alertas: AlertaResumen[];
    planes: PlanResumen[];
    documentos: DocumentoResumen[];
}
export interface PlanResumen {
    id: number;
    nombre: string;
    tipoCiclo: string;
    kmProximo: number | null;
    fechaProxima: string | null;
    kmRestantes: number | null;
}
export interface DocumentoResumen {
    id: number;
    tipo: string;
    fechaVencimiento: string;
    vencido: boolean;
    diasRestantes: number;
}
export interface DashboardCompleto {
    totalVehiculos: number;
    resumenSemaforo: {
        verde: number;
        amarillo: number;
        rojo: number;
    };
    vehiculos: TarjetaVehiculo[];
    insights: any;
}
export declare class DashboardService {
    private readonly dataSource;
    private readonly prediccionService;
    private readonly saludService;
    constructor(dataSource: DataSource, prediccionService: PrediccionService, saludService: SaludFinancieraService);
    getDashboard(rolUsuario?: RolUsuario): Promise<DashboardCompleto>;
    getDetalleVehiculo(vehiculoId: number, rolUsuario?: RolUsuario): Promise<DetalleSemaforoVehiculo>;
    private buildTarjeta;
    private filtroAlertasPorRol;
}
