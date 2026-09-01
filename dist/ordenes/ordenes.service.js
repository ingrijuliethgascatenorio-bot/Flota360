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
exports.OrdenesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const orden_trabajo_entity_1 = require("./orden-trabajo.entity");
const repuesto_orden_entity_1 = require("./repuesto-orden.entity");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
const asignacion_conductor_entity_1 = require("../asignaciones/asignacion_conductor.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
const novedad_entity_1 = require("../novedades/entities/novedad.entity");
const disponibilidad_service_1 = require("./disponibilidad.service");
const planes_service_1 = require("../planes/planes.service");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let OrdenesService = class OrdenesService {
    ordenRepo;
    repuestoRepo;
    asigRepo;
    novedadRepo;
    planesService;
    constructor(ordenRepo, repuestoRepo, asigRepo, novedadRepo, planesService) {
        this.ordenRepo = ordenRepo;
        this.repuestoRepo = repuestoRepo;
        this.asigRepo = asigRepo;
        this.novedadRepo = novedadRepo;
        this.planesService = planesService;
    }
    async crear(dto) {
        const hoy = new Date().toISOString().split('T')[0];
        if (dto.fechaOrden < hoy) {
            throw new common_1.BadRequestException('La fecha programada no puede ser anterior a la fecha actual.');
        }
        return await this.ordenRepo.manager.transaction(async (manager) => {
            const transDocRepo = manager.getRepository(documento_legal_entity_1.DocumentoLegal);
            const transAsigRepo = manager.getRepository(asignacion_conductor_entity_1.AsignacionConductor);
            const transPlanRepo = manager.getRepository(plan_mantenimiento_entity_1.PlanMantenimiento);
            const transOrdenRepo = manager.getRepository(orden_trabajo_entity_1.OrdenTrabajo);
            const transRepuestoRepo = manager.getRepository(repuesto_orden_entity_1.RepuestoOrden);
            const dispService = new disponibilidad_service_1.DisponibilidadService(transDocRepo, transAsigRepo, transPlanRepo, transOrdenRepo);
            if (dto.tipoMantenimiento === orden_trabajo_entity_1.TipoMantenimiento.PREVENTIVO) {
                await dispService.validarPlanPreventivo(dto.vehiculoId, dto.planId);
            }
            else {
                dto.planId = undefined;
            }
            const disp = await dispService.buscarFechaDisponible(dto.vehiculoId, dto.planId ?? null, dto.tipoMantenimiento, dto.fechaOrden);
            const orden = transOrdenRepo.create({
                vehiculo: { id: dto.vehiculoId },
                tecnico: { id: dto.tecnicoId },
                plan: dto.planId ? { id: dto.planId } : null,
                tipoMantenimiento: dto.tipoMantenimiento,
                fechaOrden: disp.fecha,
                fechaApertura: hoy,
                descripcion: dto.descripcion ?? null,
                costoManoObra: dto.costoManoObra ?? 0,
                estado: orden_trabajo_entity_1.EstadoOrden.ABIERTA,
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
                await manager.query(`UPDATE orden_trabajo 
           SET costo_total = COALESCE(costo_mano_obra, 0) + (
             SELECT COALESCE(SUM(subtotal), 0) 
             FROM repuesto_orden 
             WHERE orden_id = $1
           )
           WHERE id = $1`, [guardada.id]);
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
    async buscarPorId(id) {
        const orden = await this.ordenRepo.findOne({
            where: { id },
            relations: ['vehiculo', 'tecnico', 'plan', 'repuestos', 'fotos'],
        });
        if (!orden)
            throw new common_1.NotFoundException(`Orden #${id} no encontrada`);
        const novedad = await this.novedadRepo.findOne({
            where: { ordenTrabajo: { id } },
        });
        if (novedad) {
            orden.novedad = {
                id: novedad.id,
                tipoNovedad: novedad.tipoNovedad,
                descripcion: novedad.descripcion,
                fechaReporte: novedad.fechaReporte,
            };
        }
        return orden;
    }
    async listarPorConductor(conductorId) {
        const asignaciones = await this.asigRepo.find({
            where: { conductor: { id: conductorId } },
            relations: ['vehiculo'],
        });
        if (!asignaciones.length)
            return [];
        const vehiculoIds = Array.from(new Set(asignaciones.map((a) => a.vehiculo?.id).filter(Boolean)));
        if (!vehiculoIds.length)
            return [];
        const ordenes = await this.ordenRepo.find({
            where: {
                vehiculo: { id: (0, typeorm_2.In)(vehiculoIds) },
                estado: orden_trabajo_entity_1.EstadoOrden.CERRADA,
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
            tipoMantenimiento: o.tipoMantenimiento ||
                (o.plan ? orden_trabajo_entity_1.TipoMantenimiento.PREVENTIVO : orden_trabajo_entity_1.TipoMantenimiento.CORRECTIVO),
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
    async buscarPorConductor(conductorId, id) {
        const orden = await this.ordenRepo.findOne({
            where: { id },
            relations: ['vehiculo', 'tecnico', 'plan', 'repuestos', 'fotos'],
        });
        if (!orden) {
            throw new common_1.NotFoundException(`Mantenimiento #${id} no encontrado`);
        }
        if (orden.estado !== orden_trabajo_entity_1.EstadoOrden.CERRADA) {
            throw new common_1.ForbiddenException('Solo se pueden consultar órdenes de mantenimiento cerradas');
        }
        if (!orden.vehiculo) {
            throw new common_1.NotFoundException('Vehículo no asociado a esta orden');
        }
        const asignacion = await this.asigRepo.findOne({
            where: {
                conductor: { id: conductorId },
                vehiculo: { id: orden.vehiculo.id },
            },
        });
        if (!asignacion) {
            throw new common_1.ForbiddenException('No tienes autorización para consultar el mantenimiento de este vehículo');
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
            tipoMantenimiento: orden.tipoMantenimiento ||
                (orden.plan ? orden_trabajo_entity_1.TipoMantenimiento.PREVENTIVO : orden_trabajo_entity_1.TipoMantenimiento.CORRECTIVO),
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
    async listar(vehiculoId) {
        const where = vehiculoId ? { vehiculo: { id: vehiculoId } } : {};
        return this.ordenRepo.find({
            where,
            relations: ['vehiculo', 'tecnico', 'repuestos', 'fotos', 'plan'],
            order: { createdAt: 'DESC' },
        });
    }
    async cambiarEstado(id, dto, rolUsuario) {
        const orden = await this.buscarPorId(id);
        const nuevoEstado = dto.estado;
        if (orden.estado === orden_trabajo_entity_1.EstadoOrden.CERRADA &&
            rolUsuario !== usuario_entity_1.RolUsuario.ADMINISTRADOR) {
            throw new common_1.ForbiddenException('Solo el Administrador puede reabrir una orden cerrada');
        }
        const flujoValido = {
            [orden_trabajo_entity_1.EstadoOrden.ABIERTA]: [orden_trabajo_entity_1.EstadoOrden.EN_PROCESO, orden_trabajo_entity_1.EstadoOrden.CANCELADA],
            [orden_trabajo_entity_1.EstadoOrden.EN_PROCESO]: [orden_trabajo_entity_1.EstadoOrden.CERRADA, orden_trabajo_entity_1.EstadoOrden.CANCELADA],
            [orden_trabajo_entity_1.EstadoOrden.CERRADA]: [orden_trabajo_entity_1.EstadoOrden.ABIERTA],
            [orden_trabajo_entity_1.EstadoOrden.CANCELADA]: [],
        };
        if (!flujoValido[orden.estado].includes(nuevoEstado)) {
            throw new common_1.BadRequestException(`No se puede pasar de "${orden.estado}" a "${nuevoEstado}"`);
        }
        orden.estado = nuevoEstado;
        if (nuevoEstado === orden_trabajo_entity_1.EstadoOrden.CERRADA) {
            orden.fechaCierre = new Date().toISOString().split('T')[0];
            if (orden.plan) {
                const kmActual = orden.vehiculo?.kmActual ?? 0;
                await this.planesService.reiniciarCiclo(orden.plan.id, kmActual);
            }
        }
        return this.ordenRepo.save(orden);
    }
    async actualizarCostos(id, dto) {
        const orden = await this.buscarPorId(id);
        if (orden.estado === orden_trabajo_entity_1.EstadoOrden.CERRADA) {
            throw new common_1.BadRequestException('No se pueden modificar costos de una orden cerrada');
        }
        await this.ordenRepo.update(id, {
            costoManoObra: Number(dto.costoManoObra) || 0,
            descripcion: dto.descripcion ?? orden.descripcion,
        });
        if (dto.repuestos !== undefined) {
            await this.repuestoRepo.delete({ orden: { id } });
            if (dto.repuestos.length > 0) {
                const repuestos = dto.repuestos.map(r => ({
                    orden: { id },
                    nombreRepuesto: r.nombreRepuesto,
                    cantidad: r.cantidad,
                    precioUnitario: r.precioUnitario,
                }));
                await this.repuestoRepo.insert(repuestos);
            }
        }
        await this.sincronizarTotal(id);
        return this.buscarPorId(id);
    }
    async eliminar(id) {
        const orden = await this.buscarPorId(id);
        if (orden.estado === orden_trabajo_entity_1.EstadoOrden.EN_PROCESO) {
            throw new common_1.BadRequestException('No se puede eliminar una orden que está en proceso');
        }
        await this.ordenRepo.remove(orden);
        return { mensaje: `Orden #${id} eliminada correctamente` };
    }
    async agregarRepuestos(ordenId, repuestos) {
        const orden = await this.buscarPorId(ordenId);
        if (orden.estado === orden_trabajo_entity_1.EstadoOrden.CERRADA) {
            throw new common_1.BadRequestException('No se pueden agregar repuestos a una orden cerrada');
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
    async sincronizarTotal(id) {
        await this.ordenRepo.query(`UPDATE orden_trabajo 
       SET costo_total = COALESCE(costo_mano_obra, 0) + (
         SELECT COALESCE(SUM(subtotal), 0) 
         FROM repuesto_orden 
         WHERE orden_id = $1
       )
       WHERE id = $1`, [id]);
    }
};
exports.OrdenesService = OrdenesService;
exports.OrdenesService = OrdenesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(orden_trabajo_entity_1.OrdenTrabajo)),
    __param(1, (0, typeorm_1.InjectRepository)(repuesto_orden_entity_1.RepuestoOrden)),
    __param(2, (0, typeorm_1.InjectRepository)(asignacion_conductor_entity_1.AsignacionConductor)),
    __param(3, (0, typeorm_1.InjectRepository)(novedad_entity_1.Novedad)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        planes_service_1.PlanesService])
], OrdenesService);
//# sourceMappingURL=ordenes.service.js.map