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
exports.Novedad = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../../vehiculos/vehiculo.entity");
const usuario_entity_1 = require("../../usuarios/usuario.entity");
const orden_trabajo_entity_1 = require("../../ordenes/orden-trabajo.entity");
const estado_novedad_enum_1 = require("../enums/estado-novedad.enum");
let Novedad = class Novedad {
    id;
    vehiculo;
    conductor;
    tipoNovedad;
    descripcion;
    fechaReporte;
    estado;
    observacionAdmin;
    ordenTrabajo;
    createdAt;
    updatedAt;
};
exports.Novedad = Novedad;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Novedad.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], Novedad.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'conductor_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Novedad.prototype, "conductor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_novedad', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Novedad.prototype, "tipoNovedad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Novedad.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_reporte', type: 'timestamp', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], Novedad.prototype, "fechaReporte", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: estado_novedad_enum_1.EstadoNovedad,
        default: estado_novedad_enum_1.EstadoNovedad.PENDIENTE,
    }),
    __metadata("design:type", String)
], Novedad.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'observacion_admin', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Novedad.prototype, "observacionAdmin", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => orden_trabajo_entity_1.OrdenTrabajo, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'orden_trabajo_id' }),
    __metadata("design:type", Object)
], Novedad.prototype, "ordenTrabajo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Novedad.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Novedad.prototype, "updatedAt", void 0);
exports.Novedad = Novedad = __decorate([
    (0, typeorm_1.Entity)('novedad')
], Novedad);
//# sourceMappingURL=novedad.entity.js.map