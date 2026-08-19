import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { OrdenTrabajo, EstadoOrden, TipoMantenimiento } from './orden-trabajo.entity';

@Injectable()
export class DisponibilidadService {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly docRepo: Repository<DocumentoLegal>,
    @InjectRepository(AsignacionConductor)
    private readonly asignacionRepo: Repository<AsignacionConductor>,
    @InjectRepository(PlanMantenimiento)
    private readonly planRepo: Repository<PlanMantenimiento>,
    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepo: Repository<OrdenTrabajo>,
  ) {}

  async validarDocumentos(vehiculoId: number, fecha: string): Promise<void> {
    const hoy = new Date().toISOString().split('T')[0];
    const docs = await this.docRepo.find({
      where: { vehiculo: { id: vehiculoId } },
    });

    const soat = docs.find((d) => d.tipo === 'SOAT');
    const rtm = docs.find((d) => d.tipo === 'RevisionTM');

    const errors: string[] = [];

    if (soat) {
      if (soat.vencido || soat.fechaVencimiento < hoy) {
        errors.push('El vehículo no puede ser programado porque tiene el SOAT vencido.');
      } else if (soat.fechaVencimiento < fecha) {
        errors.push('El vehículo no puede ser programado porque el SOAT estará vencido para la fecha solicitada.');
      }
    }

    if (rtm) {
      if (rtm.vencido || rtm.fechaVencimiento < hoy) {
        errors.push('El vehículo no puede ser programado porque tiene la RTM vencida.');
      } else if (rtm.fechaVencimiento < fecha) {
        errors.push('El vehículo no puede ser programado porque la RTM estará vencida para la fecha solicitada.');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' '));
    }
  }

  async validarPlanPreventivo(vehiculoId: number, planId: number | undefined): Promise<void> {
    if (!planId) {
      throw new BadRequestException(
        'Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.',
      );
    }

    const plan = await this.planRepo.findOne({
      where: { id: planId },
      relations: ['vehiculo'],
    });

    if (!plan || !plan.activo || plan.vehiculo.id !== vehiculoId) {
      throw new BadRequestException(
        'Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.',
      );
    }

    // Verificar si ya existe una orden de trabajo pendiente asociada al mismo plan
    const otPendiente = await this.ordenRepo.findOne({
      where: {
        plan: { id: planId },
        estado: In([EstadoOrden.ABIERTA, EstadoOrden.EN_PROCESO]),
      },
    });

    if (otPendiente) {
      throw new BadRequestException(
        'El plan de mantenimiento seleccionado ya tiene una orden de trabajo pendiente.',
      );
    }
  }

  async tieneTurno(vehiculoId: number, fecha: string): Promise<boolean> {
    const asignacion = await this.asignacionRepo.createQueryBuilder('a')
      .where('a.vehiculo_id = :vehiculoId', { vehiculoId })
      .andWhere('a.activo = true')
      .andWhere('a.fecha_inicio <= :fecha', { fecha })
      .andWhere('(a.fecha_fin >= :fecha OR a.fecha_fin IS NULL)', { fecha })
      .getOne();

    return !!asignacion;
  }

  async existeOTIncompatible(vehiculoId: number, fecha: string): Promise<boolean> {
    const count = await this.ordenRepo.count({
      where: {
        vehiculo: { id: vehiculoId },
        fechaOrden: fecha,
        estado: In([EstadoOrden.ABIERTA, EstadoOrden.EN_PROCESO]),
      },
    });
    return count > 0;
  }

  async buscarFechaDisponible(
    vehiculoId: number,
    planId: number | null,
    tipoMantenimiento: TipoMantenimiento,
    fechaInicial: string,
  ): Promise<{ fecha: string; reprogramada: boolean; motivo: string | null }> {
    let fecha = fechaInicial;
    let reprogramada = false;
    let motivo: string | null = null;
    const limit = 30;
    let daysAdded = 0;

    // Si es correctivo, no busca otra fecha por turnos ni OTs, pero sí valida documentos para la fecha inicial.
    if (tipoMantenimiento === TipoMantenimiento.CORRECTIVO) {
      await this.validarDocumentos(vehiculoId, fecha);
      return { fecha, reprogramada: false, motivo: null };
    }

    // Preventivo busca fecha disponible
    while (daysAdded < limit) {
      // Validar documentos para la fecha actual en la iteración.
      // Si el documento vence antes de esta fecha, fallará y lanzará una excepción (bloqueará).
      await this.validarDocumentos(vehiculoId, fecha);

      const turno = await this.tieneTurno(vehiculoId, fecha);
      const otIncompatible = await this.existeOTIncompatible(vehiculoId, fecha);

      if (!turno && !otIncompatible) {
        return { fecha, reprogramada, motivo };
      }

      reprogramada = true;
      if (turno) {
        motivo = 'VEHICULO_CON_TURNO';
      } else {
        motivo = 'OT_INCOMPATIBLE';
      }

      // Avanzar 1 día
      const dateObj = new Date(fecha + 'T12:00:00');
      dateObj.setDate(dateObj.getDate() + 1);
      fecha = dateObj.toISOString().split('T')[0];
      daysAdded++;
    }

    throw new BadRequestException('No se encontró una fecha disponible dentro del límite de 30 días.');
  }
}
