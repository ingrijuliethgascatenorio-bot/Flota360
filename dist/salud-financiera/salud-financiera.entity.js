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
exports.SaludFinanciera = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
let SaludFinanciera = class SaludFinanciera {
    id;
    vehiculo;
    periodo;
    costoTotal;
    costoPromedio;
    numIntervenciones;
    repuestoMasUsado;
    cantidadRepuesto;
    calculadoEn;
};
exports.SaludFinanciera = SaludFinanciera;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SaludFinanciera.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], SaludFinanciera.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7 }),
    __metadata("design:type", String)
], SaludFinanciera.prototype, "periodo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'costo_total', type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SaludFinanciera.prototype, "costoTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'costo_promedio', type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SaludFinanciera.prototype, "costoPromedio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'num_intervenciones', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaludFinanciera.prototype, "numIntervenciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'repuesto_mas_usado', type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], SaludFinanciera.prototype, "repuestoMasUsado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cantidad_repuesto', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], SaludFinanciera.prototype, "cantidadRepuesto", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'calculado_en' }),
    __metadata("design:type", Date)
], SaludFinanciera.prototype, "calculadoEn", void 0);
exports.SaludFinanciera = SaludFinanciera = __decorate([
    (0, typeorm_1.Entity)('salud_financiera'),
    (0, typeorm_1.Index)(['vehiculo', 'periodo'], { unique: true })
], SaludFinanciera);
//# sourceMappingURL=salud-financiera.entity.js.map