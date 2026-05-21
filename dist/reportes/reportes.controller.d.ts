import { ReportesService } from './reportes.service';
import { FiltroReporteDto } from './dto/filtro-reporte.dto';
export declare class ReportesController {
    private readonly reportesService;
    constructor(reportesService: ReportesService);
    reporteCostos(filtros: FiltroReporteDto): Promise<{
        data: import("./reportes.service").ReporteCostos;
    }>;
}
