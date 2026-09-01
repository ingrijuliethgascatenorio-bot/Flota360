import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrdenTrabajo, EstadoOrden, TipoMantenimiento } from './orden-trabajo.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { Novedad } from '../novedades/entities/novedad.entity';
import { DisponibilidadService } from './disponibilidad.service';
import {
  CreateOrdenDto,
  UpdateEstadoDto,
  UpdateCostosDto,
} from './dto/create-orden.dto';
import { PlanesService } from '../planes/planes.service';
import { RolUsuario } from '../usuarios/usuario.entity';

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepo: Repository<OrdenTrabajo>,
    @InjectRepository(RepuestoOrden)
    private readonly repuestoRepo: Repository<RepuestoOrden>,
    @InjectRepository(AsignacionConductor)
    private readonly asigRepo: Repository<AsignacionConductor>,
    @InjectRepository(Novedad)
    private readonly novedadRepo: Repository<Novedad>,
    private readonly planesService: PlanesService,
  ) {}

  async crear(dto: CreateOrdenDto): Promise<any> {
    const hoy = new Date().toISOString().split('T')[0];
    if (dto.fechaOrden < hoy) {
      throw new BadRequestException('La fecha programada no puede ser anterior a la fecha actual.');
    }

    return await this.ordenRepo.manager.transaction(async (manager) => {
      const transDocRepo = manager.getRepository(DocumentoLegal);
      const transAsigRepo = manager.getRepository(AsignacionConductor);
      const transPlanRepo = manager.getRepository(PlanMantenimiento);
      const transOrdenRepo = manager.getRepository(OrdenTrabajo);
      const transRepuestoRepo = manager.getRepository(RepuestoOrden);

      const dispService = new DisponibilidadService(
        transDocRepo,
        transAsigRepo,
        transPlanRepo,
        transOrdenRepo,
      );

      // Validaciones de plan si es preventivo
      if (dto.tipoMantenimiento === TipoMantenimiento.PREVENTIVO) {
        await dispService.validarPlanPreventivo(dto.vehiculoId, dto.planId);
      } else {
        dto.planId = undefined;
      }

      // Buscar fecha disponible
      const disp = await dispService.buscarFechaDisponible(
        dto.vehiculoId,
        dto.planId ?? null,
        dto.tipoMantenimiento,
        dto.fechaOrden,
      );

      const orden = transOrdenRepo.create({
        vehiculo: { id: dto.vehiculoId } as any,
        tecnico: { id: dto.tecnicoId } as any,
        plan: dto.planId ? ({ id: dto.planId } as any) : null,
        tipoMantenimiento: dto.tipoMantenimiento,
        fechaOrden: disp.fecha,
        fechaApertura: hoy,
        descripcion: dto.descripcion ?? null,
        costoManoObra: dto.costoManoObra ?? 0,
        estado: EstadoOrden.ABIERTA,
      });

      const guardada = await transOrdenRepo.save(orden);

      if (dto.repuestos?.length) {
        for (const r of dto.repuestos) {
          const repuesto = transRepuestoRepo.create({
            orden: guardada,
            nombreRepuesto: r.nombreRepuesto,
            cantidad: r.cantidad,
            precioUnitario: r.precioUnitario,
          });
          await transRepuestoRepo.save(repuesto);
        }

        await manager.query(
          `UPDATE orden_trabajo 
           SET costo_total = COALESCE(costo_mano_obra, 0) + (
             SELECT COALESCE(SUM(subtotal), 0) 
             FROM repuesto_orden 
             WHERE orden_id = $1
           )
           WHERE id = $1`,
          [guardada.id],
        );
      }

      const ordenFinal = await transOrdenRepo.findOne({
        where: { id: guardada.id },
        relations: ['vehiculo', 'tecnico', 'plan', 'repuestos', 'fotos'],
      });

      return {
        orden: ordenFinal,
        fechaSolicitada: dto.fechaOrden,
        fechaOrden: disp.fecha,
        reprogramada: disp.reprogramada,
        motivo: disp.motivo,
      };
    });
  }

  async buscarPorId(id: number): Promise<OrdenTrabajo> {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: ['vehiculo', 'tecnico', 'plan', 'repuestos', 'fotos'],
    });
    if (!orden) throw new NotFoundException(`Orden #${id} no encontrada`);

    const novedad = await this.novedadRepo.findOne({
      where: { ordenTrabajo: { id } },
    });
    if (novedad) {
      (orden as any).novedad = {
        id: novedad.id,
        tipoNovedad: novedad.tipoNovedad,
        descripcion: novedad.descripcion,
        fechaReporte: novedad.fechaReporte,
      };
    }

    return orden;
  }

  async listarPorConductor(conductorId: number): Promise<any[]> {
    const asignaciones = await this.asigRepo.find({
      where: { conductor: { id: conductorId } },
      relations: ['vehiculo'],
    });

    if (!asignaciones.length) return [];

    const vehiculoIds = Array.from(
      new Set(asignaciones.map((a) => a.vehiculo?.id).filter(Boolean)),
    );

    if (!vehiculoIds.length) return [];

    const ordenes = await this.ordenRepo.find({
      where: {
        vehiculo: { id: In(vehiculoIds) },
        estado: EstadoOrden.CERRADA,
      },
      relations: ['vehiculo', 'tecnico', 'plan'],
      order: { fechaCierre: 'DESC', fechaApertura: 'DESC', id: 'DESC' },
    });

    return ordenes.map((o) => ({
      id: o.id,
      vehiculo: o.vehiculo
        ? {
            id: o.vehiculo.id,
            placa: o.vehiculo.placa,
            marca: o.vehiculo.marca,
            modelo: o.vehiculo.modelo,
            anio: o.vehiculo.anio,
            kmActual: o.vehiculo.kmActual,
            capacidad: o.vehiculo.capacidad,
            numMotor: o.vehiculo.numMotor,
            numChasis: o.vehiculo.numChasis,
          }
        : null,
      tipoMantenimiento:
        o.tipoMantenimiento ||
        (o.plan ? TipoMantenimiento.PREVENTIVO : TipoMantenimiento.CORRECTIVO),
      fechaOrden: o.fechaOrden,
      fechaApertura: o.fechaApertura,
      fechaCierre: o.fechaCierre,
      estado: o.estado,
      tecnico: o.tecnico ? { id: o.tecnico.id, nombre: o.tecnico.nombre } : null,
      plan: o.plan ? { id: o.plan.id, nombre: o.plan.nombre } : null,
      descripcion: o.descripcion,
      costoManoObra: Number(o.costoManoObra || 0),
      costoTotal: Number(o.costoTotal || 0),
    }));
  }

  async buscarPorConductor(conductorId: number, id: number): Promise<any> {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: ['vehiculo', 'tecnico', 'plan', 'repuestos', 'fotos'],
    });

    if (!orden) {
      throw new NotFoundException(`Mantenimiento #${id} no encontrado`);
    }

    if (orden.estado !== EstadoOrden.CERRADA) {
      throw new ForbiddenException(
        'Solo se pueden consultar órdenes de mantenimiento cerradas',
      );
    }

    if (!orden.vehiculo) {
      throw new NotFoundException('Vehículo no asociado a esta orden');
    }

    const asignacion = await this.asigRepo.findOne({
      where: {
        conductor: { id: conductorId },
        vehiculo: { id: orden.vehiculo.id },
      },
    });

    if (!asignacion) {
      throw new ForbiddenException(
        'No tienes autorización para consultar el mantenimiento de este vehículo',
      );
    }

    const novedad = await this.novedadRepo.findOne({
      where: { ordenTrabajo: { id: orden.id } },
    });

    return {
      id: orden.id,
      fechaOrden: orden.fechaOrden,
      fechaApertura: orden.fechaApertura,
      fechaCierre: orden.fechaCierre,
      estado: orden.estado,
      tipoMantenimiento:
        orden.tipoMantenimiento ||
        (orden.plan ? TipoMantenimiento.PREVENTIVO : TipoMantenimiento.CORRECTIVO),
      descripcion: orden.descripcion,
      costoManoObra: Number(orden.costoManoObra || 0),
      costoTotal: Number(orden.costoTotal || 0),
      vehiculo: {
        id: orden.vehiculo.id,
        placa: orden.vehiculo.placa,
        marca: orden.vehiculo.marca,
        modelo: orden.vehiculo.modelo,
        anio: orden.vehiculo.anio,
        capacidad: orden.vehiculo.capacidad,
        numMotor: orden.vehiculo.numMotor,
        numChasis: orden.vehiculo.numChasis,
        kmActual: orden.vehiculo.kmActual,
      },
      tecnico: orden.tecnico
        ? {
            id: orden.tecnico.id,
            nombre: orden.tecnico.nombre,
          }
        : null,
      plan: orden.plan
        ? {
            id: orden.plan.id,
            nombre: orden.plan.nombre,
          }
        : null,
      novedad: novedad
        ? {
            id: novedad.id,
            tipoNovedad: novedad.tipoNovedad,
            descripcion: novedad.descripcion,
            fechaReporte: novedad.fechaReporte,
          }
        : null,
      repuestos: (orden.repuestos || []).map((r) => ({
        id: r.id,
        nombreRepuesto: r.nombreRepuesto,
        cantidad: r.cantidad,
        precioUnitario: Number(r.precioUnitario || 0),
        subtotal: Number(r.subtotal || 0),
      })),
      fotos: {
        antes: (orden.fotos || [])
          .filter((f) => f.tipoFoto === 'antes')
          .map((f) => ({
            id: f.id,
            url: f.url,
            tipoFoto: f.tipoFoto,
            tomadaEn: f.tomadaEn,
          })),
        despues: (orden.fotos || [])
          .filter((f) => f.tipoFoto === 'despues')
          .map((f) => ({
            id: f.id,
            url: f.url,
            tipoFoto: f.tipoFoto,
            tomadaEn: f.tomadaEn,
          })),
      },
    };
  }

  async listar(vehiculoId?: number): Promise<OrdenTrabajo[]> {
    const where = vehiculoId ? { vehiculo: { id: vehiculoId } } : {};
    return this.ordenRepo.find({
      where,
      relations: ['vehiculo', 'tecnico', 'repuestos', 'fotos', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async cambiarEstado(
    id: number,
    dto: UpdateEstadoDto,
    rolUsuario: RolUsuario,
  ): Promise<OrdenTrabajo> {
    const orden = await this.buscarPorId(id);
    const nuevoEstado = dto.estado as EstadoOrden;

    if (
      orden.estado === EstadoOrden.CERRADA &&
      rolUsuario !== RolUsuario.ADMINISTRADOR
    ) {
      throw new ForbiddenException(
        'Solo el Administrador puede reabrir una orden cerrada',
      );
    }

    const flujoValido: Record<EstadoOrden, EstadoOrden[]> = {
      [EstadoOrden.ABIERTA]: [EstadoOrden.EN_PROCESO, EstadoOrden.CANCELADA],
      [EstadoOrden.EN_PROCESO]: [EstadoOrden.CERRADA, EstadoOrden.CANCELADA],
      [EstadoOrden.CERRADA]: [EstadoOrden.ABIERTA],
      [EstadoOrden.CANCELADA]: [],
    };

    if (!flujoValido[orden.estado].includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede pasar de "${orden.estado}" a "${nuevoEstado}"`,
      );
    }

    orden.estado = nuevoEstado;

    if (nuevoEstado === EstadoOrden.CERRADA) {
      orden.fechaCierre = new Date().toISOString().split('T')[0];

      if (orden.plan) {
        const kmActual = orden.vehiculo?.kmActual ?? 0;
        await this.planesService.reiniciarCiclo(orden.plan.id, kmActual);
      }
    }

    return this.ordenRepo.save(orden);
  }

  async actualizarCostos(
    id: number,
    dto: UpdateCostosDto,
  ): Promise<OrdenTrabajo> {
    const orden = await this.buscarPorId(id);

    if (orden.estado === EstadoOrden.CERRADA) {
      throw new BadRequestException('No se pueden modificar costos de una orden cerrada');
    }

    // 1. Actualización parcial de campos básicos
    await this.ordenRepo.update(id, {
      costoManoObra: Number(dto.costoManoObra) || 0,
      descripcion: dto.descripcion ?? orden.descripcion,
    });

    // 2. Gestión de Repuestos (Solo si vienen en el DTO)
    if (dto.repuestos !== undefined) {
      // Limpieza física por ID de orden
      await this.repuestoRepo.delete({ orden: { id } as any });

      if (dto.repuestos.length > 0) {
        // Inserción masiva eficiente
        const repuestos = dto.repuestos.map(r => ({
          orden: { id } as any,
          nombreRepuesto: r.nombreRepuesto,
          cantidad: r.cantidad,
          precioUnitario: r.precioUnitario,
        }));
        await this.repuestoRepo.insert(repuestos);
      }
    }

    // 3. Forzar sincronización del costo_total (dispara trigger o emula lógica)
    await this.sincronizarTotal(id);

    return this.buscarPorId(id);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const orden = await this.buscarPorId(id);

    if (orden.estado === EstadoOrden.EN_PROCESO) {
      throw new BadRequestException(
        'No se puede eliminar una orden que está en proceso',
      );
    }

    await this.ordenRepo.remove(orden);
    return { mensaje: `Orden #${id} eliminada correctamente` };
  }

  async agregarRepuestos(
    ordenId: number,
    repuestos: {
      nombreRepuesto: string;
      cantidad: number;
      precioUnitario: number;
    }[],
  ): Promise<OrdenTrabajo> {
    const orden = await this.buscarPorId(ordenId);

    if (orden.estado === EstadoOrden.CERRADA) {
      throw new BadRequestException(
        'No se pueden agregar repuestos a una orden cerrada',
      );
    }

    for (const r of repuestos) {
      const repuesto = this.repuestoRepo.create({
        orden,
        nombreRepuesto: r.nombreRepuesto,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
      });
      await this.repuestoRepo.save(repuesto);
    }

    await this.sincronizarTotal(ordenId);
    return this.buscarPorId(ordenId);
  }

  private async sincronizarTotal(id: number): Promise<void> {
    await this.ordenRepo.query(
      `UPDATE orden_trabajo 
       SET costo_total = COALESCE(costo_mano_obra, 0) + (
         SELECT COALESCE(SUM(subtotal), 0) 
         FROM repuesto_orden 
         WHERE orden_id = $1
       )
       WHERE id = $1`,
      [id],
    );
  }

}
