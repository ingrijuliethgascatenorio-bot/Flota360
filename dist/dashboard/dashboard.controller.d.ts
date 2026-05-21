import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboard(req: any): Promise<{
        data: import("./dashboard.service").DashboardCompleto;
    }>;
    getDetalleVehiculo(vehiculoId: number, req: any): Promise<{
        data: import("./dashboard.service").DetalleSemaforoVehiculo;
    }>;
}
