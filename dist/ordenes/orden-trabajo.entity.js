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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdenTrabajo = exports.EstadoOrden = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
const usuario_entity_1 = require("../usuarios/usuario.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
const repuesto_orden_entity_1 = require("./repuesto-orden.entity");
const foto_orden_entity_1 = require("../fotos/foto-orden.entity");
var EstadoOrden;
(function (EstadoOrden) {
    EstadoOrden["ABIERTA"] = "Abierta";
    EstadoOrden["EN_PROCESO"] = "En proceso";
    EstadoOrden["CERRADA"] = "Cerrada";
    EstadoOrden["CANCELADA"] = "Cancelada";
})(EstadoOrden || (exports.EstadoOrden = EstadoOrden = {}));
let OrdenTrabajo = class OrdenTrabajo {
    id;
    vehiculo;
    tecnico;
    plan;
    fechaApertura;
    fechaCierre;
    descripcion;
    costoManoObra;
    costoTotal;
    estado;
    repuestos;
    fotos;
    createdAt;
    updatedAt;
};
exports.OrdenTrabajo = OrdenTrabajo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], OrdenTrabajo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], OrdenTrabajo.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'tecnico_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], OrdenTrabajo.prototype, "tecnico", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_mantenimiento_entity_1.PlanMantenimiento, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", Object)
], OrdenTrabajo.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_apertura', type: 'date' }),
    __metadata("design:type", String)
], OrdenTrabajo.prototype, "fechaApertura", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_cierre', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], OrdenTrabajo.prototype, "fechaCierre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], OrdenTrabajo.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'costo_mano_obra',
        type: 'numeric',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], OrdenTrabajo.prototype, "costoManoObra", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'costo_total',
        type: 'numeric',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], OrdenTrabajo.prototype, "costoTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EstadoOrden, default: EstadoOrden.ABIERTA }),
    __metadata("design:type", String)
], OrdenTrabajo.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => repuesto_orden_entity_1.RepuestoOrden, (r) => r.orden, { cascade: true }),
    __metadata("design:type", Array)
], OrdenTrabajo.prototype, "repuestos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => foto_orden_entity_1.FotoOrden, (f) => f.orden),
    __metadata("design:type", Array)
], OrdenTrabajo.prototype, "fotos", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], OrdenTrabajo.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], OrdenTrabajo.prototype, "updatedAt", void 0);
exports.OrdenTrabajo = OrdenTrabajo = __decorate([
    (0, typeorm_1.Entity)('orden_trabajo')
], OrdenTrabajo);
//# sourceMappingURL=orden-trabajo.entity.js.map