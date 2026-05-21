import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroKm, MomentoKm } from './registro-km.entity';
import { CreateRegistroKmDto } from './dto/create-registro-km.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PlanesService } from '../planes/planes.service';
import { RolUsuario } from '../usuarios/usuario.entity';
import {
  AsignacionConductor,
  TurnoAsignacion,
} from '../asignaciones/asignacion_conductor.entity';
import { PrediccionService } from '../prediccion/prediccion.service';

@Injectable()
export class KilometrajeService {
  constructor(
    @InjectRepository(RegistroKm)
    private readonly repo: Repository<RegistroKm>,

    @InjectRepository(AsignacionConductor)
    private readonly asignRepo: Repository<AsignacionConductor>,

    private readonly vehiculosService: VehiculosService,
    private readonly usuariosService: UsuariosService,
    private readonly planesService: PlanesService,
    private readonly prediccionService: PrediccionService,
  ) {}

  async registrar(
    vehiculoId: number,
    conductorId: number,
    dto: CreateRegistroKmDto,
  ): Promise<RegistroKm> {
    const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);
    const conductor = (await this.usuariosService.buscarPorId(
      conductorId,
    )) as any;

    if (
      conductor.rol !== RolUsuario.CONDUCTOR &&
      conductor.rol !== RolUsuario.ADMINISTRADOR
    ) {
      throw new BadRequestException('Solo los conductores pueden registrar km');
    }

    // Validar asignación del conductor para hoy / su turno
    if (conductor.rol === RolUsuario.CONDUCTOR) {
      const hoy = new Date().toISOString().split('T')[0];
      const asignacion = await this.asignRepo
        .createQueryBuilder('a')
        .where('a.vehiculo_id = :vid', { vid: vehiculoId })
        .andWhere('a.conductor_id = :cid', { cid: conductorId })
        .andWhere('a.activo = true')
        .andWhere(
          '(a.fecha_inicio = :hoy OR (a.fecha_inicio <= :hoy AND (a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)))',
          { hoy },
        )
        .getOne();

      if (!asignacion) {
        throw new BadRequestException(
          'No tienes este vehículo asignado para el día de hoy, para esta fecha o para tu turno (Mañana, Tarde, Noche o Completo).',
        );
      }
    }

    // RNF-01 — el km no puede retroceder
    if (dto.kmValor < vehiculo.kmActual) {
      throw new BadRequestException(
        `El km ingresado (${dto.kmValor}) no puede ser menor al km actual del vehículo (${vehiculo.kmActual})`,
      );
    }

    const registro = this.repo.create({
      vehiculo,
      conductor: { id: conductorId } as any,
      kmValor: dto.kmValor,
      momento: dto.momento,
    });

    await this.repo.save(registro);

    // Actualizar km del vehículo primero (necesario para la predicción)
    await this.vehiculosService.actualizar(vehiculoId, {
      kmActual: dto.kmValor,
    } as any);

    // RF-INN-01 — calcular km/día y actualizar predicción centralizada
    const resPred = await this.prediccionService.calcularPrediccion(vehiculoId);
    
    // Actualizar también los planes individuales (Sistema A)
    await this.planesService.recalcularPrediccion(vehiculoId, resPred.kmPorDia);

    // REGLA: Si es km de FIN de turno, finalizar la asignación activa automáticamente
    if (dto.momento === MomentoKm.FIN) {
      await this.finalizarAsignacionActiva(vehiculoId, conductorId);
    }

    return registro;
  }

  /**
   * Busca y finaliza la asignación activa del conductor para el vehículo dado hoy.
   */
  private async finalizarAsignacionActiva(vehiculoId: number, conductorId: number) {
    const hoy = new Date().toISOString().split('T')[0];
    const asignacion = await this.asignRepo.findOne({
      where: {
        vehiculo: { id: vehiculoId },
        conductor: { id: conductorId },
        fechaInicio: hoy,
        activo: true
      }
    });

    if (asignacion) {
      asignacion.activo = false;
      asignacion.fechaFin = asignacion.fechaFin ?? hoy;
      await this.asignRepo.save(asignacion);
    }
  }

  async historial(vehiculoId: number): Promise<RegistroKm[]> {
    return this.repo.find({
      where: { vehiculo: { id: vehiculoId } },
      order: { registradoEn: 'DESC' },
      take: 50,
    });
  }

  // ── REGLA 4: Encadenamiento automático de km entre turnos ─────────────────
  // El backend detecta el turno del conductor leyendo su asignación de hoy.
  // El conductor NO necesita seleccionar nada extra en el frontend.
  //
  //   TARDE  → busca el FIN del turno MAÑANA de hoy
  //   NOCHE  → busca el FIN del turno TARDE de hoy
  //   MAÑANA / COMPLETO → sin encadenamiento, devuelve km actual del vehículo
  //
  // Endpoint: GET /vehiculos/:id/kilometraje/km-inicio  (conductorId viene del JWT)
  async kmInicioEncadenado(
    vehiculoId: number,
    conductorId: number,
  ): Promise<{
    kmSugerido: number;
    encadenado: boolean;
    turno: string;
    mensaje: string;
  }> {
    const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Buscar la asignación activa del conductor para este vehículo hoy
    const asignacion = await this.asignRepo
      .createQueryBuilder('a')
      .where('a.vehiculo_id = :vid', { vid: vehiculoId })
      .andWhere('a.conductor_id = :cid', { cid: conductorId })
      .andWhere('a.activo = true')
      .andWhere(
        '(a.fecha_inicio = :hoy OR (a.fecha_inicio <= :hoy AND (a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)))',
        { hoy },
      )
      .getOne();

    if (!asignacion) {
      return {
        kmSugerido: vehiculo.kmActual,
        encadenado: false,
        turno: 'sin_asignacion',
        mensaje: 'Sin asignación activa hoy. Se usa el km actual del vehículo.',
      };
    }

    const turno = asignacion.turno;

    // MAÑANA y COMPLETO no tienen turno anterior del que encadenar
    const turnoAnterior: Partial<Record<TurnoAsignacion, TurnoAsignacion>> = {
      [TurnoAsignacion.TARDE]: TurnoAsignacion.MANANA,
      [TurnoAsignacion.NOCHE]: TurnoAsignacion.TARDE,
    };

    const anterior = turnoAnterior[turno];
    if (!anterior) {
      return {
        kmSugerido: vehiculo.kmActual,
        encadenado: false,
        turno,
        mensaje: `Turno ${turno}: se ingresa el km de inicio manualmente.`,
      };
    }

    // 2. Buscar el registro FIN más reciente de HOY para este vehículo
    //    (no importa qué conductor lo registró — es el estado real del bus)
    const inicioDia = new Date(`${hoy}T00:00:00.000Z`);
    const finDia = new Date(`${hoy}T23:59:59.999Z`);

    const registroFin = await this.repo
      .createQueryBuilder('r')
      .where('r.vehiculo_id = :vid', { vid: vehiculoId })
      .andWhere('r.momento = :momento', { momento: MomentoKm.FIN })
      .andWhere('r.registrado_en >= :ini', { ini: inicioDia })
      .andWhere('r.registrado_en <= :fin', { fin: finDia })
      .orderBy('r.registrado_en', 'DESC')
      .getOne();

    if (!registroFin) {
      return {
        kmSugerido: vehiculo.kmActual,
        encadenado: false,
        turno,
        mensaje: `El turno ${anterior} aún no registró FIN. Se usa el km actual (${vehiculo.kmActual} km).`,
      };
    }

    return {
      kmSugerido: registroFin.kmValor,
      encadenado: true,
      turno,
      mensaje: `Km encadenado desde el FIN del turno ${anterior}: ${registroFin.kmValor} km.`,
    };
  }

  async calcularKmPorDia(vehiculoId: number) {
    return this.prediccionService.calcularKmDia(vehiculoId);
  }
}
