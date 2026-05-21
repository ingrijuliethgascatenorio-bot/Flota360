import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Alerta } from './alerta.entity';
import { Configuracion } from '../configuracion/configuracion.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { RolUsuario } from '../usuarios/usuario.entity';
export interface Umbrales {
    km: number;
    dias: number;
}
export interface ResumenCron {
    vehiculoId: number;
    generadas: number;
}
export declare class AlertasService implements OnModuleInit {
    private readonly alertaRepo;
    private readonly configRepo;
    private readonly vehiculoRepo;
    private readonly planRepo;
    private readonly documentoRepo;
    private readonly logger;
    constructor(alertaRepo: Repository<Alerta>, configRepo: Repository<Configuracion>, vehiculoRepo: Repository<Vehiculo>, planRepo: Repository<PlanMantenimiento>, documentoRepo: Repository<DocumentoLegal>);
    onModuleInit(): Promise<void>;
    getUmbrales(): Promise<Umbrales>;
    actualizarUmbrales(km?: number, dias?: number): Promise<Umbrales>;
    evaluarAlertasMantenimiento(vehiculoId: number): Promise<Alerta[]>;
    evaluarAlertasDocumentos(vehiculoId: number): Promise<Alerta[]>;
    limpiarAlertasDocumento(documentoId: number): Promise<void>;
    listarAlertas(vehiculoId: number, filtro?: 'mantenimiento' | 'documento' | 'todas', soloNoLeidas?: boolean, rolUsuario?: RolUsuario): Promise<Alerta[]>;
    marcarLeida(alertaId: number, vehiculoId: number): Promise<Alerta>;
    ejecutarEvaluacionGlobal(): Promise<ResumenCron[]>;
    private recalcularSemaforo;
    private calcularTipoAlertaMantenimiento;
    private calcularTipoAlertaDocumento;
    private diasRestantes;
    private buildMensajeMantenimiento;
    private buildMensajeDocumento;
    private formatearFecha;
}
