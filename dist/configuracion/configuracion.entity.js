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
exports.Configuracion = void 0;
const typeorm_1 = require("typeorm");
let Configuracion = class Configuracion {
    clave;
    valorEntero;
    valorTexto;
    descripcion;
    updatedAt;
};
exports.Configuracion = Configuracion;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 60 }),
    __metadata("design:type", String)
], Configuracion.prototype, "clave", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_entero', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Configuracion.prototype, "valorEntero", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_texto', type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], Configuracion.prototype, "valorTexto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], Configuracion.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Configuracion.prototype, "updatedAt", void 0);
exports.Configuracion = Configuracion = __decorate([
    (0, typeorm_1.Entity)('configuracion')
], Configuracion);
//# sourceMappingURL=configuracion.entity.js.map