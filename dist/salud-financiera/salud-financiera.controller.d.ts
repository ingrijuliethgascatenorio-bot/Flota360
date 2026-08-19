import { SaludFinancieraService } from './salud-financiera.service';
import { FiltroRankingDto } from '../reportes/dto/filtro-reporte.dto';
export declare class SaludFinancieraController {
    private readonly saludService;
    constructor(saludService: SaludFinancieraService);
    getInsights(periodo?: string): Promise<{
        data: import("./salud-financiera.service").InsightsDashboard;
    }>;
    getRanking(dto: FiltroRankingDto): Promise<{
        data: import("./salud-financiera.service").FilaRanking[];
        total: number;
    }>;
}
