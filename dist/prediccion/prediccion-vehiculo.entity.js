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
exports.PrediccionVehiculo = exports.ColorUrgencia = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
var ColorUrgencia;
(function (ColorUrgencia) {
    ColorUrgencia["VERDE"] = "verde";
    ColorUrgencia["AMARILLO"] = "amarillo";
    ColorUrgencia["ROJO"] = "rojo";
    ColorUrgencia["GRIS"] = "gris";
})(ColorUrgencia || (exports.ColorUrgencia = ColorUrgencia = {}));
let PrediccionVehiculo = class PrediccionVehiculo {
    id;
    vehiculo;
    kmPorDia;
    diasEstimados;
    fechaEstimada;
    planNombre;
    colorUrgencia;
    mensaje;
    calculadoEn;
};
exports.PrediccionVehiculo = PrediccionVehiculo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PrediccionVehiculo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], PrediccionVehiculo.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'km_por_dia', type: 'numeric', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PrediccionVehiculo.prototype, "kmPorDia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dias_estimados', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PrediccionVehiculo.prototype, "diasEstimados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_estimada', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PrediccionVehiculo.prototype, "fechaEstimada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_nombre', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], PrediccionVehiculo.prototype, "planNombre", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'color_urgencia',
        type: 'enum',
        enum: ColorUrgencia,
        default: ColorUrgencia.GRIS,
    }),
    __metadata("design:type", String)
], PrediccionVehiculo.prototype, "colorUrgencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mensaje', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], PrediccionVehiculo.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'calculado_en' }),
    __metadata("design:type", Date)
], PrediccionVehiculo.prototype, "calculadoEn", void 0);
exports.PrediccionVehiculo = PrediccionVehiculo = __decorate([
    (0, typeorm_1.Entity)('prediccion_vehiculo'),
    (0, typeorm_1.Index)(['vehiculo'], { unique: true })
], PrediccionVehiculo);
//# sourceMappingURL=prediccion-vehiculo.entity.js.map