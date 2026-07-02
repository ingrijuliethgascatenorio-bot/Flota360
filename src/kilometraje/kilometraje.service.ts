import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroKm, MomentoKm } from './registro-km.entity';
import { CreateRegistroKmDto } from './dto/create-registro-km.dto';
import { CerrarPendienteDto } from './dto/cerrar-pendiente.dto';
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

  private async finalizarAsignacionActiva(
    vehiculoId: number,
    conductorId: number,
  ) {
    const hoy = new Date().toISOString().split('T')[0];
    const asignacion = await this.asignRepo
      .createQueryBuilder('a')
      .where('a.vehiculo_id = :vehiculoId', { vehiculoId })
      .andWhere('a.conductor_id = :conductorId', { conductorId })
      .andWhere('a.activo = true')
      .andWhere('a.fecha_inicio <= :hoy', { hoy })
      .andWhere('(a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)', { hoy })
      .getOne();

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

  async historialConductor(conductorId: number): Promise<RegistroKm[]> {
    return this.repo.find({
      where: { conductor: { id: conductorId } },
      relations: ['vehiculo'],
      order: { registradoEn: 'DESC' },
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

  // ── Turnos pendientes: inicios sin fin correspondiente ───────────────────
  async turnosPendientes(conductorId: number): Promise<any[]> {
    return this.repo
      .createQueryBuilder('r_ini')
      .leftJoinAndSelect('r_ini.vehiculo', 'v')
      .leftJoin(
        RegistroKm,
        'r_fin',
        `r_fin.vehiculo_id = r_ini.vehiculo_id
         AND r_fin.conductor_id = r_ini.conductor_id
         AND r_fin.momento = 'fin'
         AND DATE(r_fin.registrado_en AT TIME ZONE 'America/Bogota') = DATE(r_ini.registrado_en AT TIME ZONE 'America/Bogota')`,
      )
      .where('r_ini.conductor_id = :cid', { cid: conductorId })
      .andWhere('r_ini.momento = :m', { m: MomentoKm.INICIO })
      .andWhere('r_fin.id IS NULL')
      .orderBy('r_ini.registrado_en', 'DESC')
      .select([
        'r_ini.id            AS "registroInicioId"',
        'r_ini.km_valor      AS "kmInicio"',
        'r_ini.registrado_en AS "fecha"',
        'v.id                AS "vehiculoId"',
        'v.placa             AS "placa"',
        'v.marca             AS "marca"',
      ])
      .getRawMany();
  }

  // ── Cerrar turno pendiente (bypass validación de fecha de asignación) ─────
  async cerrarTurnoPendiente(
    conductorId: number,
    registroInicioId: number,
    dto: CerrarPendienteDto,
  ): Promise<RegistroKm> {
    // 1. Verificar que el inicio existe y pertenece a este conductor
    const regInicio = await this.repo.findOne({
      where: {
        id: registroInicioId,
        conductor: { id: conductorId },
        momento: MomentoKm.INICIO,
      },
      relations: ['vehiculo'],
    });
    if (!regInicio) {
      throw new NotFoundException(
        'Registro de inicio no encontrado o no te pertenece',
      );
    }

    // 2. Verificar que no haya ya un fin en el mismo día
    const fechaDia = new Date(regInicio.registradoEn)
      .toISOString()
      .split('T')[0];
    const yaExisteFin = await this.repo
      .createQueryBuilder('r')
      .where('r.conductor_id = :cid', { cid: conductorId })
      .andWhere('r.vehiculo_id = :vid', { vid: regInicio.vehiculo.id })
      .andWhere('r.momento = :m', { m: MomentoKm.FIN })
      .andWhere(
        `DATE(r.registrado_en AT TIME ZONE 'America/Bogota') = :fecha`,
        { fecha: fechaDia },
      )
      .getOne();

    if (yaExisteFin) {
      throw new BadRequestException('Este turno ya tiene km fin registrado');
    }

    // 3. km fin no puede ser menor al inicio
    if (dto.kmFin < regInicio.kmValor) {
      throw new BadRequestException(
        `El km fin (${dto.kmFin}) no puede ser menor al km inicio (${regInicio.kmValor})`,
      );
    }

    // 4. Insertar registro de fin — SIN validar asignación por fecha
    const regFin = this.repo.create({
      vehiculo: regInicio.vehiculo,
      conductor: { id: conductorId } as any,
      kmValor: dto.kmFin,
      momento: MomentoKm.FIN,
    });
    await this.repo.save(regFin);

    // 5. Actualizar km del vehículo y recalcular predicción (igual que flujo normal)
    await this.vehiculosService.actualizar(regInicio.vehiculo.id, {
      kmActual: dto.kmFin,
    } as any);
    const resPred = await this.prediccionService.calcularPrediccion(
      regInicio.vehiculo.id,
    );
    await this.planesService.recalcularPrediccion(
      regInicio.vehiculo.id,
      resPred.kmPorDia,
    );

    return regFin;
  }

  async calcularKmPorDia(vehiculoId: number) {
    return this.prediccionService.calcularKmDia(vehiculoId);
  }
}
