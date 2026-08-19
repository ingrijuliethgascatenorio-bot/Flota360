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
exports.AsignacionConductor = exports.TurnoAsignacion = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
const usuario_entity_1 = require("../usuarios/usuario.entity");
var TurnoAsignacion;
(function (TurnoAsignacion) {
    TurnoAsignacion["MANANA"] = "manana";
    TurnoAsignacion["TARDE"] = "tarde";
    TurnoAsignacion["NOCHE"] = "noche";
    TurnoAsignacion["COMPLETO"] = "completo";
})(TurnoAsignacion || (exports.TurnoAsignacion = TurnoAsignacion = {}));
let AsignacionConductor = class AsignacionConductor {
    id;
    vehiculo;
    conductor;
    turno;
    fechaInicio;
    fechaFin;
    activo;
    observaciones;
    createdAt;
    updatedAt;
};
exports.AsignacionConductor = AsignacionConductor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AsignacionConductor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo, { onDelete: 'CASCADE', eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], AsignacionConductor.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'CASCADE', eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'conductor_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], AsignacionConductor.prototype, "conductor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TurnoAsignacion,
        default: TurnoAsignacion.COMPLETO,
    }),
    __metadata("design:type", String)
], AsignacionConductor.prototype, "turno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date' }),
    __metadata("design:type", String)
], AsignacionConductor.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], AsignacionConductor.prototype, "fechaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AsignacionConductor.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AsignacionConductor.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AsignacionConductor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AsignacionConductor.prototype, "updatedAt", void 0);
exports.AsignacionConductor = AsignacionConductor = __decorate([
    (0, typeorm_1.Entity)('asignacion_conductor')
], AsignacionConductor);
//# sourceMappingURL=asignacion_conductor.entity.js.map