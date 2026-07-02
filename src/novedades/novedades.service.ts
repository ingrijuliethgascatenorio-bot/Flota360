import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Novedad } from './entities/novedad.entity';
import { EstadoNovedad } from './enums/estado-novedad.enum';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { AprobarNovedadDto, RechazarNovedadDto, FiltrarNovedadesDto } from './dto/aprobar-novedad.dto';
import { AsignacionesService } from '../asignaciones/asignaciones.service';
import { OrdenesService } from '../ordenes/ordenes.service';

@Injectable()
export class NovedadesService {
  constructor(
    @InjectRepository(Novedad)
    private readonly repo: Repository<Novedad>,

    private readonly asignacionesService: AsignacionesService,
    private readonly ordenesService: OrdenesService,
  ) {}

  // ── CONDUCTOR: Reportar novedad ───────────────────────────────────────────
  // El conductor NO envía vehiculoId. El backend lo resuelve desde la asignación
  // activa del conductor.
  async crear(conductorId: number, dto: CreateNovedadDto): Promise<Novedad> {
    // 1. Obtener asignaciones activas del conductor hoy
    const asignaciones = await this.asignacionesService.porConductor(conductorId);

    if (!asignaciones.length) {
      throw new UnprocessableEntityException(
        'No tienes vehículos asignados para el día de hoy. ' +
        'No es posible reportar una novedad sin una asignación activa.',
      );
    }

    // 2. Si hay más de una asignación activa (conductor con 2-3 vehículos),
    //    tomamos el vehículo de la asignación más reciente.
    //    NOTA DE MEJORA FUTURA: si hay múltiples, se puede pedir al conductor
    //    que seleccione cuál vehículo tiene el problema (ver sección mejoras).
    const asignacionActiva = asignaciones[0];
    const vehiculoId = asignacionActiva.vehiculo.id;

    // 3. Crear la novedad
    const novedad = this.repo.create({
      vehiculo:   { id: vehiculoId } as any,
      conductor:  { id: conductorId } as any,
      tipoNovedad: dto.tipoNovedad,
      descripcion: dto.descripcion,
      estado: EstadoNovedad.PENDIENTE,
    });

    return this.repo.save(novedad);
  }

  // ── CONDUCTOR: Ver sus propias novedades ──────────────────────────────────
  async misNovedades(conductorId: number): Promise<Novedad[]> {
    return this.repo.find({
      where: { conductor: { id: conductorId } },
      relations: ['vehiculo', 'ordenTrabajo'],
      order: { fechaReporte: 'DESC' },
    });
  }

  // ── ADMINISTRADOR: Listar todas con filtros opcionales ────────────────────
  async listar(filtros: FiltrarNovedadesDto): Promise<Novedad[]> {
    const qb = this.repo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.vehiculo', 'v')
      .leftJoinAndSelect('n.conductor', 'c')
      .leftJoinAndSelect('n.ordenTrabajo', 'ot')
      .orderBy('n.fechaReporte', 'DESC');

    if (filtros.estado) {
      qb.andWhere('n.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.vehiculoId) {
      qb.andWhere('v.id = :vid', { vid: filtros.vehiculoId });
    }

    if (filtros.desde) {
      qb.andWhere('n.fechaReporte >= :desde', { desde: filtros.desde });
    }

    if (filtros.hasta) {
      // Incluir el día completo
      qb.andWhere("n.fechaReporte < :hasta::date + INTERVAL '1 day'", {
        hasta: filtros.hasta,
      });
    }

    return qb.getMany();
  }

  // ── ADMINISTRADOR: Ver detalle de una novedad ─────────────────────────────
  async buscarPorId(id: number): Promise<Novedad> {
    const novedad = await this.repo.findOne({
      where: { id },
      relations: ['vehiculo', 'conductor', 'ordenTrabajo'],
    });
    if (!novedad) throw new NotFoundException(`Novedad #${id} no encontrada`);
    return novedad;
  }

  // ── ADMINISTRADOR: Aprobar novedad + crear OT automáticamente ────────────
  async aprobar(id: number, dto: AprobarNovedadDto): Promise<Novedad> {
    const novedad = await this.buscarPorId(id);

    // Validación de estado
    if (novedad.estado !== EstadoNovedad.PENDIENTE) {
      throw new BadRequestException(
        `La novedad #${id} ya fue procesada (estado: ${novedad.estado}). ` +
        'Solo se pueden aprobar novedades en estado Pendiente.',
      );
    }

    // Generar descripción automática de la OT a partir de la novedad
    const descripcionOT = this.generarDescripcionOT(novedad);

    // Crear la Orden de Trabajo en estado ABIERTA
    // Se reutiliza OrdenesService.crear() que ya existe y ya maneja el estado inicial
    const orden = await this.ordenesService.crear({
      vehiculoId:   novedad.vehiculo.id,
      tecnicoId:    dto.tecnicoId,
      descripcion:  descripcionOT,
      costoManoObra: 0,   // el técnico lo completará más adelante
      // planId: undefined → no viene de un plan de mantenimiento
    });

    // Actualizar la novedad: marcar como Aprobada y guardar referencia a la OT
    novedad.estado          = EstadoNovedad.APROBADA;
    novedad.observacionAdmin = dto.observacion ?? null;
    novedad.ordenTrabajo    = orden;

    return this.repo.save(novedad);
  }

  // ── ADMINISTRADOR: Rechazar novedad ───────────────────────────────────────
  async rechazar(id: number, dto: RechazarNovedadDto): Promise<Novedad> {
    const novedad = await this.buscarPorId(id);

    if (novedad.estado !== EstadoNovedad.PENDIENTE) {
      throw new BadRequestException(
        `La novedad #${id} ya fue procesada (estado: ${novedad.estado}).`,
      );
    }

    novedad.estado           = EstadoNovedad.RECHAZADA;
    novedad.observacionAdmin = dto.observacion ?? null;

    return this.repo.save(novedad);
  }

  // ── Generación automática de descripción para la OT ──────────────────────
  private generarDescripcionOT(novedad: Novedad): string {
    return (
      `Orden creada automáticamente desde la novedad #${novedad.id}.\n` +
      `Vehículo: ${novedad.vehiculo.placa}\n` +
      `Tipo de novedad: ${novedad.tipoNovedad}\n` +
      `Descripción reportada:\n${novedad.descripcion}`
    );
  }
}
