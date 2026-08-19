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
exports.RepuestoOrden = void 0;
const typeorm_1 = require("typeorm");
const orden_trabajo_entity_1 = require("./orden-trabajo.entity");
let RepuestoOrden = class RepuestoOrden {
    id;
    orden;
    nombreRepuesto;
    cantidad;
    precioUnitario;
    subtotal;
};
exports.RepuestoOrden = RepuestoOrden;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RepuestoOrden.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => orden_trabajo_entity_1.OrdenTrabajo, (o) => o.repuestos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'orden_id' }),
    __metadata("design:type", orden_trabajo_entity_1.OrdenTrabajo)
], RepuestoOrden.prototype, "orden", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_repuesto', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], RepuestoOrden.prototype, "nombreRepuesto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RepuestoOrden.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'precio_unitario', type: 'numeric', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RepuestoOrden.prototype, "precioUnitario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RepuestoOrden.prototype, "subtotal", void 0);
exports.RepuestoOrden = RepuestoOrden = __decorate([
    (0, typeorm_1.Entity)('repuesto_orden')
], RepuestoOrden);
//# sourceMappingURL=repuesto-orden.entity.js.map