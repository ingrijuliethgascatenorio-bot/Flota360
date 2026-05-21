"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KilometrajeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const registro_km_entity_1 = require("./registro-km.entity");
const vehiculos_service_1 = require("../vehiculos/vehiculos.service");
const usuarios_service_1 = require("../usuarios/usuarios.service");
const planes_service_1 = require("../planes/planes.service");
const usuario_entity_1 = require("../usuarios/usuario.entity");
const asignacion_conductor_entity_1 = require("../asignaciones/asignacion_conductor.entity");
const prediccion_service_1 = require("../prediccion/prediccion.service");
let KilometrajeService = class KilometrajeService {
    repo;
    asignRepo;
    vehiculosService;
    usuariosService;
    planesService;
    prediccionService;
    constructor(repo, asignRepo, vehiculosService, usuariosService, planesService, prediccionService) {
        this.repo = repo;
        this.asignRepo = asignRepo;
        this.vehiculosService = vehiculosService;
        this.usuariosService = usuariosService;
        this.planesService = planesService;
        this.prediccionService = prediccionService;
    }
    async registrar(vehiculoId, conductorId, dto) {
        const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);
        const conductor = (await this.usuariosService.buscarPorId(conductorId));
        if (conductor.rol !== usuario_entity_1.RolUsuario.CONDUCTOR &&
            conductor.rol !== usuario_entity_1.RolUsuario.ADMINISTRADOR) {
            throw new common_1.BadRequestException('Solo los conductores pueden registrar km');
        }
        if (conductor.rol === usuario_entity_1.RolUsuario.CONDUCTOR) {
            const hoy = new Date().toISOString().split('T')[0];
            const asignacion = await this.asignRepo
                .createQueryBuilder('a')
                .where('a.vehiculo_id = :vid', { vid: vehiculoId })
                .andWhere('a.conductor_id = :cid', { cid: conductorId })
                .andWhere('a.activo = true')
                .andWhere('(a.fecha_inicio = :hoy OR (a.fecha_inicio <= :hoy AND (a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)))', { hoy })
                .getOne();
            if (!asignacion) {
                throw new common_1.BadRequestException('No tienes este vehículo asignado para el día de hoy, para esta fecha o para tu turno (Mañana, Tarde, Noche o Completo).');
            }
        }
        if (dto.kmValor < vehiculo.kmActual) {
            throw new common_1.BadRequestException(`El km ingresado (${dto.kmValor}) no puede ser menor al km actual del vehículo (${vehiculo.kmActual})`);
        }
        const registro = this.repo.create({
            vehiculo,
            conductor: { id: conductorId },
            kmValor: dto.kmValor,
            momento: dto.momento,
        });
        await this.repo.save(registro);
        await this.vehiculosService.actualizar(vehiculoId, {
            kmActual: dto.kmValor,
        });
        const resPred = await this.prediccionService.calcularPrediccion(vehiculoId);
        await this.planesService.recalcularPrediccion(vehiculoId, resPred.kmPorDia);
        if (dto.momento === registro_km_entity_1.MomentoKm.FIN) {
            await this.finalizarAsignacionActiva(vehiculoId, conductorId);
        }
        return registro;
    }
    async finalizarAsignacionActiva(vehiculoId, conductorId) {
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
    async historial(vehiculoId) {
        return this.repo.find({
            where: { vehiculo: { id: vehiculoId } },
            order: { registradoEn: 'DESC' },
            take: 50,
        });
    }
    async kmInicioEncadenado(vehiculoId, conductorId) {
        const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);
        const hoy = new Date().toISOString().split('T')[0];
        const asignacion = await this.asignRepo
            .createQueryBuilder('a')
            .where('a.vehiculo_id = :vid', { vid: vehiculoId })
            .andWhere('a.conductor_id = :cid', { cid: conductorId })
            .andWhere('a.activo = true')
            .andWhere('(a.fecha_inicio = :hoy OR (a.fecha_inicio <= :hoy AND (a.fecha_fin >= :hoy OR a.fecha_fin IS NULL)))', { hoy })
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
        const turnoAnterior = {
            [asignacion_conductor_entity_1.TurnoAsignacion.TARDE]: asignacion_conductor_entity_1.TurnoAsignacion.MANANA,
            [asignacion_conductor_entity_1.TurnoAsignacion.NOCHE]: asignacion_conductor_entity_1.TurnoAsignacion.TARDE,
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
        const inicioDia = new Date(`${hoy}T00:00:00.000Z`);
        const finDia = new Date(`${hoy}T23:59:59.999Z`);
        const registroFin = await this.repo
            .createQueryBuilder('r')
            .where('r.vehiculo_id = :vid', { vid: vehiculoId })
            .andWhere('r.momento = :momento', { momento: registro_km_entity_1.MomentoKm.FIN })
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
    async calcularKmPorDia(vehiculoId) {
        return this.prediccionService.calcularKmDia(vehiculoId);
    }
};
exports.KilometrajeService = KilometrajeService;
exports.KilometrajeService = KilometrajeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(registro_km_entity_1.RegistroKm)),
    __param(1, (0, typeorm_1.InjectRepository)(asignacion_conductor_entity_1.AsignacionConductor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        vehiculos_service_1.VehiculosService,
        usuarios_service_1.UsuariosService,
        planes_service_1.PlanesService,
        prediccion_service_1.PrediccionService])
], KilometrajeService);
//# sourceMappingURL=kilometraje.service.js.map