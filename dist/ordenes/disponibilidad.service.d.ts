import { Repository } from 'typeorm';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { OrdenTrabajo, TipoMantenimiento } from './orden-trabajo.entity';
export declare class DisponibilidadService {
    private readonly docRepo;
    private readonly asignacionRepo;
    private readonly planRepo;
    private readonly ordenRepo;
    constructor(docRepo: Repository<DocumentoLegal>, asignacionRepo: Repository<AsignacionConductor>, planRepo: Repository<PlanMantenimiento>, ordenRepo: Repository<OrdenTrabajo>);
    validarDocumentos(vehiculoId: number, fecha: string): Promise<void>;
    validarPlanPreventivo(vehiculoId: number, planId: number | undefined): Promise<void>;
    tieneTurno(vehiculoId: number, fecha: string): Promise<boolean>;
    existeOTIncompatible(vehiculoId: number, fecha: string): Promise<boolean>;
    buscarFechaDisponible(vehiculoId: number, planId: number | null, tipoMantenimiento: TipoMantenimiento, fechaInicial: string): Promise<{
        fecha: string;
        reprogramada: boolean;
        motivo: string | null;
    }>;
}
