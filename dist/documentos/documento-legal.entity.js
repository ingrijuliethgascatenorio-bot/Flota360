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
exports.DocumentoLegal = exports.TipoDocumento = void 0;
const typeorm_1 = require("typeorm");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
var TipoDocumento;
(function (TipoDocumento) {
    TipoDocumento["SOAT"] = "SOAT";
    TipoDocumento["REVISION_TM"] = "RevisionTM";
})(TipoDocumento || (exports.TipoDocumento = TipoDocumento = {}));
let DocumentoLegal = class DocumentoLegal {
    id;
    vehiculo;
    tipo;
    fechaVencimiento;
    archivoUrl;
    vencido;
    createdAt;
    updatedAt;
};
exports.DocumentoLegal = DocumentoLegal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DocumentoLegal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehiculo_entity_1.Vehiculo, (vehiculo) => vehiculo.documentos, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'vehiculo_id' }),
    __metadata("design:type", vehiculo_entity_1.Vehiculo)
], DocumentoLegal.prototype, "vehiculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TipoDocumento }),
    __metadata("design:type", String)
], DocumentoLegal.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_vencimiento', type: 'date' }),
    __metadata("design:type", String)
], DocumentoLegal.prototype, "fechaVencimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'archivo_url', type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], DocumentoLegal.prototype, "archivoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], DocumentoLegal.prototype, "vencido", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DocumentoLegal.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DocumentoLegal.prototype, "updatedAt", void 0);
exports.DocumentoLegal = DocumentoLegal = __decorate([
    (0, typeorm_1.Entity)('documento_legal')
], DocumentoLegal);
//# sourceMappingURL=documento-legal.entity.js.map