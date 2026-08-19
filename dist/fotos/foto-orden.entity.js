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
exports.FotoOrden = exports.TipoFoto = void 0;
const typeorm_1 = require("typeorm");
const orden_trabajo_entity_1 = require("../ordenes/orden-trabajo.entity");
const usuario_entity_1 = require("../usuarios/usuario.entity");
var TipoFoto;
(function (TipoFoto) {
    TipoFoto["ANTES"] = "antes";
    TipoFoto["DESPUES"] = "despues";
})(TipoFoto || (exports.TipoFoto = TipoFoto = {}));
let FotoOrden = class FotoOrden {
    id;
    orden;
    url;
    tipoFoto;
    tamanoBytes;
    subidaPor;
    tomadaEn;
};
exports.FotoOrden = FotoOrden;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FotoOrden.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => orden_trabajo_entity_1.OrdenTrabajo, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'orden_id' }),
    __metadata("design:type", orden_trabajo_entity_1.OrdenTrabajo)
], FotoOrden.prototype, "orden", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300 }),
    __metadata("design:type", String)
], FotoOrden.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_foto', type: 'enum', enum: TipoFoto }),
    __metadata("design:type", String)
], FotoOrden.prototype, "tipoFoto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tamano_bytes', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FotoOrden.prototype, "tamanoBytes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'subida_por' }),
    __metadata("design:type", Object)
], FotoOrden.prototype, "subidaPor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'tomada_en' }),
    __metadata("design:type", Date)
], FotoOrden.prototype, "tomadaEn", void 0);
exports.FotoOrden = FotoOrden = __decorate([
    (0, typeorm_1.Entity)('foto_orden')
], FotoOrden);
//# sourceMappingURL=foto-orden.entity.js.map