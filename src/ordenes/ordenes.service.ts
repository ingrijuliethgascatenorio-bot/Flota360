import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenTrabajo, EstadoOrden } from './orden-trabajo.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
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
    private readonly planesService: PlanesService,
  ) {}

  async crear(dto: CreateOrdenDto): Promise<OrdenTrabajo> {
    const orden = this.ordenRepo.create({
      vehiculo: { id: dto.vehiculoId } as any,
      tecnico: { id: dto.tecnicoId } as any,
      plan: dto.planId ? ({ id: dto.planId } as any) : null,
      fechaApertura: new Date().toISOString().split('T')[0],
      descripcion: dto.descripcion ?? null,
      costoManoObra: dto.costoManoObra ?? 0,
      estado: EstadoOrden.ABIERTA,
    });

    const guardada = await this.ordenRepo.save(orden);

    if (dto.repuestos?.length) {
      await this.agregarRepuestos(guardada.id, dto.repuestos);
    }

    return this.buscarPorId(guardada.id);
  }

  async buscarPorId(id: number): Promise<OrdenTrabajo> {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: ['vehiculo', 'tecnico', 'plan', 'repuestos', 'fotos'],
    });
    if (!orden) throw new NotFoundException(`Orden #${id} no encontrada`);
    return orden;
  }

  async listar(vehiculoId?: number): Promise<OrdenTrabajo[]> {
    const where = vehiculoId ? { vehiculo: { id: vehiculoId } } : {};
    return this.ordenRepo.find({
      where,
      relations: ['vehiculo', 'tecnico', 'repuestos', 'fotos'],
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
