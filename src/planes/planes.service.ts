import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanMantenimiento, TipoCiclo } from './plan-mantenimiento.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { Alerta } from '../alertas/alerta.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(PlanMantenimiento)
    private readonly repo: Repository<PlanMantenimiento>,
    private readonly vehiculosService: VehiculosService,
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
  ) {}

  async crear(vehiculoId: number, dto: CreatePlanDto): Promise<PlanMantenimiento> {
    const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);

    if (
      (dto.tipoCiclo === TipoCiclo.KM || dto.tipoCiclo === TipoCiclo.COMBINADO) &&
      !dto.intervaloKm
    ) throw new BadRequestException('intervaloKm es requerido para este tipo de ciclo');

    if (
      (dto.tipoCiclo === TipoCiclo.DIAS || dto.tipoCiclo === TipoCiclo.COMBINADO) &&
      !dto.intervaloDias
    ) throw new BadRequestException('intervaloDias es requerido para este tipo de ciclo');

    // Calcular km_proximo y fecha_proxima iniciales
    const hoy = new Date();
    const kmProximo = dto.intervaloKm
      ? vehiculo.kmActual + dto.intervaloKm
      : null;

    let fechaProxima: string | null = null;
    if (dto.intervaloDias) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + dto.intervaloDias);
      fechaProxima = fecha.toISOString().split('T')[0];
    }

    const plan = this.repo.create({
      vehiculo,
      nombre: dto.nombre,
      tipoCiclo: dto.tipoCiclo,
      intervaloKm: dto.intervaloKm ?? null,
      intervaloDias: dto.intervaloDias ?? null,
      kmProximo,
      fechaProxima,
    });

    return this.repo.save(plan);
  }

  async listarPorVehiculo(vehiculoId: number): Promise<PlanMantenimiento[]> {
    await this.vehiculosService.buscarPorId(vehiculoId);
    return this.repo.find({
      where: { vehiculo: { id: vehiculoId }, activo: true },
      order: { createdAt: 'DESC' },
    });
  }

  async buscarPorId(id: number): Promise<PlanMantenimiento> {
    const plan = await this.repo.findOne({ where: { id }, relations: ['vehiculo'] });
    if (!plan) throw new NotFoundException(`Plan #${id} no encontrado`);
    return plan;
  }

  async desactivar(id: number): Promise<void> {
    const plan = await this.buscarPorId(id);
    plan.activo = false;
    await this.repo.save(plan);
  }

  /**
   * RF-INN-01 + RF-INN-02 — Recalcula kmPorDia y fechaEstimada para todos los planes
   * activos de un vehículo. Se llama desde KilometrajeService al registrar km.
   */
  async recalcularPrediccion(
    vehiculoId: number,
    kmPorDia: number | null,
  ): Promise<void> {
    const planes = await this.repo.find({
      where: { vehiculo: { id: vehiculoId }, activo: true },
      relations: ['vehiculo'],
    });

    const hoy = new Date();

    for (const plan of planes) {
      plan.kmPorDia = kmPorDia;

      if (!kmPorDia || kmPorDia === 0 || !plan.kmProximo || !plan.vehiculo.kmActual) {
        plan.colorUrgencia = kmPorDia === 0 ? 'sin_actividad' : null;
        plan.fechaEstimada = null;
      } else {
        const kmRestantes = plan.kmProximo - plan.vehiculo.kmActual;
        const diasEstimados = kmRestantes > 0 ? Math.floor(kmRestantes / kmPorDia) : 0;

        const fechaEst = new Date(hoy);
        fechaEst.setDate(fechaEst.getDate() + diasEstimados);
        plan.fechaEstimada = fechaEst.toISOString().split('T')[0];

        // Semáforo RF-INN-02
        const colorAnterior = plan.colorUrgencia;
        if (diasEstimados > 15)       plan.colorUrgencia = 'verde';
        else if (diasEstimados >= 7)  plan.colorUrgencia = 'amarillo';
        else                          plan.colorUrgencia = 'rojo';

        // Cambio de color → se podría generar alerta aquí (Sprint 3)
        if (colorAnterior && colorAnterior !== plan.colorUrgencia) {
          // TODO Sprint 3: alertasService.crearPorCambioColor(plan)
        }
      }

      plan.prediccionActualizadaEn = new Date();
      await this.repo.save(plan);
    }
  }

  /**
   * Reinicia el ciclo del plan al cerrar una orden de trabajo (RF-04)
   */
  async reiniciarCiclo(planId: number, kmActual: number): Promise<void> {
    const plan = await this.buscarPorId(planId);
    const hoy = new Date();

    if (plan.intervaloKm) {
      plan.kmProximo = kmActual + plan.intervaloKm;
    }
    if (plan.intervaloDias) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + plan.intervaloDias);
      plan.fechaProxima = fecha.toISOString().split('T')[0];
    }

    await this.repo.save(plan);

    // 1. Limpiar alertas activas para este plan
    await this.alertaRepo.update(
      { plan: { id: planId }, leida: false },
      { leida: true },
    );

    // 2. Recalcular semáforo del vehículo
    if (plan.vehiculo?.id) {
      await this.recalcularSemaforo(plan.vehiculo.id);
    }
  }

  private async recalcularSemaforo(vehiculoId: number): Promise<void> {
    const alertasActivas = await this.alertaRepo.find({
      where: { vehiculo: { id: vehiculoId }, leida: false },
      select: ['tipoAlerta'],
    });

    const tipos = new Set(alertasActivas.map((a) => a.tipoAlerta));

    let semaforo: string;

    if (
      tipos.has('mantenimiento_vencido' as any) ||
      tipos.has('documento_vencido' as any) ||
      tipos.has('documento_7dias' as any)
    ) {
      semaforo = 'rojo';
    } else if (
      tipos.has('mantenimiento_proximo' as any) ||
      tipos.has('documento_15dias' as any) ||
      tipos.has('documento_30dias' as any)
    ) {
      semaforo = 'amarillo';
    } else {
      semaforo = 'verde';
    }

    await this.vehiculoRepo.update(vehiculoId, { estadoSemaforo: semaforo as any });
  }
}
