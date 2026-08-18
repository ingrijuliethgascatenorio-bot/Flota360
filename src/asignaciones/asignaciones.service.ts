import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  AsignacionConductor,
  TurnoAsignacion,
} from './asignacion_conductor.entity';
import { CreateAsignacionDto } from './dto/create.asignacion.dto';
import { UpdateAsignacionDto } from './dto/update.asignacion.dto';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';

@Injectable()
export class AsignacionesService {
  constructor(
    @InjectRepository(AsignacionConductor)
    private readonly repo: Repository<AsignacionConductor>,
    @InjectRepository(DocumentoLegal)
    private readonly docRepo: Repository<DocumentoLegal>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(PlanMantenimiento)
    private readonly planRepo: Repository<PlanMantenimiento>,
  ) {}

  private async validarVehiculoParaAsignar(vehiculoId: number): Promise<void> {
    const vehiculo = await this.vehiculoRepo.findOne({ where: { id: vehiculoId } });
    if (!vehiculo) {
      throw new NotFoundException(`El vehículo #${vehiculoId} no existe`);
    }

    if (vehiculo.estadoSemaforo === 'rojo') {
      throw new BadRequestException(
        `El vehículo ${vehiculo.placa} no puede ser asignado: el semáforo está en ROJO.`,
      );
    }

    const planEnRojo = await this.planRepo.findOne({
      where: { vehiculo: { id: vehiculoId }, activo: true, colorUrgencia: 'rojo' },
    });

    if (planEnRojo) {
      throw new BadRequestException(
        `El vehículo ${vehiculo.placa} no puede ser asignado: tiene el plan de mantenimiento "${planEnRojo.nombre}" en ROJO.`,
      );
    }
  }

  // ── Crear asignación con validaciones ─────────────────────────────────────
  async crear(dto: CreateAsignacionDto): Promise<AsignacionConductor> {
    const fIni = dto.fechaInicio;
    const fFin = dto.fechaFin || dto.fechaInicio;

    // Validar semáforo y planes activos en rojo
    await this.validarVehiculoParaAsignar(dto.vehiculoId);

    // Traer todas las asignaciones activas que se solapen con este rango de fechas
    // (Ya sea del mismo vehículo o del mismo conductor)
    const solapadas = await this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.conductor', 'c')
      .leftJoinAndSelect('a.vehiculo', 'v')
      .where('a.activo = true')
      .andWhere(
        new Brackets((qb) => {
          qb.where('v.id = :vid', { vid: dto.vehiculoId }).orWhere(
            'c.id = :cid',
            { cid: dto.conductorId },
          );
        }),
      )
      .andWhere(
        '(a.fechaInicio <= :fFin AND (a.fechaFin >= :fIni OR a.fechaFin IS NULL))',
        { fIni, fFin },
      )
      .getMany();

    for (const a of solapadas) {
      // 1. Validaciones por VEHÍCULO
      if (Number(a.vehiculo.id) === Number(dto.vehiculoId)) {
        if (
          a.turno === TurnoAsignacion.COMPLETO ||
          dto.turno === TurnoAsignacion.COMPLETO ||
          a.turno === dto.turno
        ) {
          throw new BadRequestException(
            `Conflicto de vehículo: ${a.vehiculo.placa} ya tiene un turno (${a.turno}) que interfiere con el nuevo (${dto.turno}).`,
          );
        }
      }

      // 2. Validaciones por CONDUCTOR
      if (Number(a.conductor.id) === Number(dto.conductorId)) {
        if (
          a.turno === TurnoAsignacion.COMPLETO ||
          dto.turno === TurnoAsignacion.COMPLETO ||
          a.turno === dto.turno
        ) {
          throw new BadRequestException(
            `Conflicto de conductor: El conductor ya tiene una asignación (${a.turno} en ${a.vehiculo.placa}) en este periodo.`,
          );
        }
      }
    }

    // ── Validar documentos del vehículo ────────────────────────────────────
    const hoy = new Date().toISOString().split('T')[0];
    const docsVencidos = await this.docRepo
      .createQueryBuilder('d')
      .where('d.vehiculo_id = :vid', { vid: dto.vehiculoId })
      .andWhere('d.fecha_vencimiento < :hoy', { hoy })
      .getMany();

    if (docsVencidos.length > 0) {
      const nombres = docsVencidos.map(d => `${d.tipo} (venció ${d.fechaVencimiento})`).join(', ');
      throw new BadRequestException(
        `El vehículo no puede ser asignado: tiene documentos vencidos → ${nombres}`,
      );
    }

    // ── Todo OK → guardar ───────────────────────────────────────────────────
    const asignacion = this.repo.create({
      vehiculo: { id: dto.vehiculoId } as any,
      conductor: { id: dto.conductorId } as any,
      turno: dto.turno,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin ?? null,
      observaciones: dto.observaciones ?? null,
      activo: true,
    });
    return this.repo.save(asignacion);
  }

  // ── Listar todas las asignaciones activas ──────────────────────────────────
  async listarActivas(): Promise<AsignacionConductor[]> {
    return this.repo.find({
      relations: ['vehiculo', 'conductor'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Listar asignaciones de un vehículo ────────────────────────────────────
  async porVehiculo(vehiculoId: number): Promise<AsignacionConductor[]> {
    await this.buscarPorId(vehiculoId).catch(() => {});
    return this.repo.find({
      where: { vehiculo: { id: vehiculoId }, activo: true },
      relations: ['conductor'],
      order: { fechaInicio: 'DESC' },
    });
  }

  // ── Listar asignaciones de un conductor vigentes HOY ─────────────────────
  // Solo trae asignaciones cuyo rango de fechas cubre el día actual
  async porConductor(conductorId: number): Promise<AsignacionConductor[]> {
    const hoy = new Date().toISOString().split('T')[0];
    return this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.vehiculo', 'v')
      .where('a.conductor_id = :cid', { cid: conductorId })
      .andWhere('a.activo = true')
      .andWhere('a.fecha_inicio <= :hoy', { hoy })
      .andWhere('(a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)', { hoy })
      .orderBy('a.created_at', 'DESC')
      .getMany();
  }

  // ── Desactivar / finalizar asignación ─────────────────────────────────────
  async desactivar(id: number): Promise<AsignacionConductor> {
    const asig = await this.repo.findOne({ where: { id } });
    if (!asig) throw new NotFoundException(`Asignación #${id} no encontrada`);
    asig.activo = false;
    asig.fechaFin = asig.fechaFin ?? new Date().toISOString().split('T')[0];
    return this.repo.save(asig);
  }

  // ── Historial completo (activas + inactivas) de un vehículo ───────────────
  async historialVehiculo(vehiculoId: number): Promise<AsignacionConductor[]> {
    return this.repo.find({
      where: { vehiculo: { id: vehiculoId } },
      relations: ['conductor'],
      order: { fechaInicio: 'DESC' },
    });
  }

  // ── Buscar una asignación por ID ──────────────────────────────────────────
  async buscarPorId(id: number): Promise<AsignacionConductor> {
    const asig = await this.repo.findOne({
      where: { id },
      relations: ['vehiculo', 'conductor'],
    });
    if (!asig) throw new NotFoundException(`Asignación #${id} no encontrada`);
    return asig;
  }

  // ── Actualizar asignación con validaciones ─────────────────────────────────
  async actualizar(id: number, dto: UpdateAsignacionDto): Promise<AsignacionConductor> {
    const asig = await this.buscarPorId(id);

    const vehiculoId = dto.vehiculoId !== undefined ? dto.vehiculoId : asig.vehiculo?.id;
    const conductorId = dto.conductorId !== undefined ? dto.conductorId : asig.conductor?.id;
    const turno = dto.turno !== undefined ? dto.turno : asig.turno;
    const fechaInicio = dto.fechaInicio !== undefined ? dto.fechaInicio : asig.fechaInicio;
    const fechaFin = dto.fechaFin !== undefined ? dto.fechaFin : asig.fechaFin;
    const activo = dto.activo !== undefined ? dto.activo : asig.activo;

    if (activo) {
      // Validar semáforo y planes activos en rojo si el vehículo cambió o se reactivó la asignación
      if (vehiculoId) {
        await this.validarVehiculoParaAsignar(vehiculoId);
      }

      // Validar solapamiento con otras asignaciones (excluyendo la actual)
      const fIni = fechaInicio;
      const fFin = fechaFin || fechaInicio;

      const solapadas = await this.repo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.conductor', 'c')
        .leftJoinAndSelect('a.vehiculo', 'v')
        .where('a.activo = true')
        .andWhere('a.id != :id', { id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('v.id = :vid', { vid: vehiculoId }).orWhere(
              'c.id = :cid',
              { cid: conductorId },
            );
          }),
        )
        .andWhere(
          '(a.fechaInicio <= :fFin AND (a.fechaFin >= :fIni OR a.fechaFin IS NULL))',
          { fIni, fFin },
        )
        .getMany();

      for (const a of solapadas) {
        // 1. Validaciones por VEHÍCULO
        if (Number(a.vehiculo.id) === Number(vehiculoId)) {
          if (
            a.turno === TurnoAsignacion.COMPLETO ||
            turno === TurnoAsignacion.COMPLETO ||
            a.turno === turno
          ) {
            throw new BadRequestException(
              `Conflicto de vehículo: ${a.vehiculo.placa} ya tiene un turno (${a.turno}) que interfiere con el nuevo (${turno}).`,
            );
          }
        }

        // 2. Validaciones por CONDUCTOR
        if (Number(a.conductor.id) === Number(conductorId)) {
          if (
            a.turno === TurnoAsignacion.COMPLETO ||
            turno === TurnoAsignacion.COMPLETO ||
            a.turno === turno
          ) {
            throw new BadRequestException(
              `Conflicto de conductor: El conductor ya tiene una asignación (${a.turno} en ${a.vehiculo.placa}) en este periodo.`,
            );
          }
        }
      }
    }

    // Actualizar propiedades
    if (dto.vehiculoId !== undefined) {
      asig.vehiculo = { id: dto.vehiculoId } as any;
    }
    if (dto.conductorId !== undefined) {
      asig.conductor = { id: dto.conductorId } as any;
    }
    if (dto.turno !== undefined) asig.turno = dto.turno;
    if (dto.fechaInicio !== undefined) asig.fechaInicio = dto.fechaInicio;
    if (dto.fechaFin !== undefined) asig.fechaFin = dto.fechaFin || null;
    if (dto.observaciones !== undefined) asig.observaciones = dto.observaciones || null;
    if (dto.activo !== undefined) asig.activo = dto.activo;

    await this.repo.save(asig);
    return this.buscarPorId(id);
  }

  async todasPorConductor(conductorId: number): Promise<AsignacionConductor[]> {
    return this.repo.find({
      where: { conductor: { id: conductorId } },
      relations: ['vehiculo', 'conductor'],
      order: { fechaInicio: 'DESC', createdAt: 'DESC' },
    });
  }
}
