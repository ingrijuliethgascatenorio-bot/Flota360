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
exports.RegistroKm = exports.MomentoKm = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
const usuario_entity_1 = require("../usuarios/usuario.entity");
var MomentoKm;
(function (MomentoKm) {
    MomentoKm["INICIO"] = "inicio";
    MomentoKm["FIN"] = "fin";
})(MomentoKm || (exports.MomentoKm = MomentoKm = {}));
let RegistroKm = class RegistroKm {
    id;
    vehiculo;
    conductor;
    kmValor;
    momento;
    registradoEn;
};
exports.RegistroKm = RegistroKm;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RegistroKm.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], RegistroKm.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'conductor_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], RegistroKm.prototype, "conductor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'km_valor', type: 'int' }),
    __metadata("design:type", Number)
], RegistroKm.prototype, "kmValor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MomentoKm }),
    __metadata("design:type", String)
], RegistroKm.prototype, "momento", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'registrado_en' }),
    __metadata("design:type", Date)
], RegistroKm.prototype, "registradoEn", void 0);
exports.RegistroKm = RegistroKm = __decorate([
    (0, typeorm_1.Entity)('registro_km')
], RegistroKm);
//# sourceMappingURL=registro-km.entity.js.map