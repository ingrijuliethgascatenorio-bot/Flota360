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
exports.Alerta = exports.TipoAlerta = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
var TipoAlerta;
(function (TipoAlerta) {
    TipoAlerta["MANTENIMIENTO_PROXIMO"] = "mantenimiento_proximo";
    TipoAlerta["MANTENIMIENTO_VENCIDO"] = "mantenimiento_vencido";
    TipoAlerta["DOCUMENTO_30DIAS"] = "documento_30dias";
    TipoAlerta["DOCUMENTO_15DIAS"] = "documento_15dias";
    TipoAlerta["DOCUMENTO_7DIAS"] = "documento_7dias";
    TipoAlerta["DOCUMENTO_VENCIDO"] = "documento_vencido";
    TipoAlerta["ORDEN_NUEVA"] = "orden_nueva";
})(TipoAlerta || (exports.TipoAlerta = TipoAlerta = {}));
let Alerta = class Alerta {
    id;
    vehiculo;
    plan;
    documento;
    tipoAlerta;
    mensaje;
    leida;
    generadaEn;
};
exports.Alerta = Alerta;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Alerta.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], Alerta.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_mantenimiento_entity_1.PlanMantenimiento, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", Object)
], Alerta.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => documento_legal_entity_1.DocumentoLegal, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'documento_id' }),
    __metadata("design:type", Object)
], Alerta.prototype, "documento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_alerta', type: 'enum', enum: TipoAlerta }),
    __metadata("design:type", String)
], Alerta.prototype, "tipoAlerta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300 }),
    __metadata("design:type", String)
], Alerta.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Alerta.prototype, "leida", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'generada_en' }),
    __metadata("design:type", Date)
], Alerta.prototype, "generadaEn", void 0);
exports.Alerta = Alerta = __decorate([
    (0, typeorm_1.Entity)('alerta'),
    (0, typeorm_1.Check)(`"plan_id" IS NOT NULL OR "documento_id" IS NOT NULL`)
], Alerta);
//# sourceMappingURL=alerta.entity.js.map