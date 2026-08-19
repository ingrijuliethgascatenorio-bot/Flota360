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
exports.PlanMantenimiento = exports.TipoCiclo = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
var TipoCiclo;
(function (TipoCiclo) {
    TipoCiclo["KM"] = "km";
    TipoCiclo["DIAS"] = "dias";
    TipoCiclo["COMBINADO"] = "combinado";
})(TipoCiclo || (exports.TipoCiclo = TipoCiclo = {}));
let PlanMantenimiento = class PlanMantenimiento {
    id;
    vehiculo;
    nombre;
    tipoCiclo;
    intervaloKm;
    intervaloDias;
    kmProximo;
    fechaProxima;
    kmPorDia;
    fechaEstimada;
    colorUrgencia;
    prediccionActualizadaEn;
    activo;
    createdAt;
    updatedAt;
};
exports.PlanMantenimiento = PlanMantenimiento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PlanMantenimiento.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], PlanMantenimiento.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PlanMantenimiento.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_ciclo', type: 'enum', enum: TipoCiclo }),
    __metadata("design:type", String)
], PlanMantenimiento.prototype, "tipoCiclo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'intervalo_km', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "intervaloKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'intervalo_dias', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "intervaloDias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'km_proximo', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "kmProximo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_proxima', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "fechaProxima", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'km_por_dia', type: 'float', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "kmPorDia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_estimada', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "fechaEstimada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'color_urgencia', type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "colorUrgencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prediccion_actualizada_en', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], PlanMantenimiento.prototype, "prediccionActualizadaEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PlanMantenimiento.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PlanMantenimiento.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PlanMantenimiento.prototype, "updatedAt", void 0);
exports.PlanMantenimiento = PlanMantenimiento = __decorate([
    (0, typeorm_1.Entity)('plan_mantenimiento')
], PlanMantenimiento);
//# sourceMappingURL=plan-mantenimiento.entity.js.map