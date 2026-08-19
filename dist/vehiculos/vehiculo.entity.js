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
exports.Vehiculo = exports.EstadoSemaforo = void 0;
const typeorm_1 = require("typeorm");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
var EstadoSemaforo;
(function (EstadoSemaforo) {
    EstadoSemaforo["VERDE"] = "verde";
    EstadoSemaforo["AMARILLO"] = "amarillo";
    EstadoSemaforo["ROJO"] = "rojo";
})(EstadoSemaforo || (exports.EstadoSemaforo = EstadoSemaforo = {}));
let Vehiculo = class Vehiculo {
    id;
    placa;
    marca;
    modelo;
    anio;
    kmActual;
    capacidad;
    numMotor;
    numChasis;
    fotoUrl;
    estadoSemaforo;
    activo;
    documentos;
    createdAt;
    updatedAt;
};
exports.Vehiculo = Vehiculo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Vehiculo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, unique: true }),
    __metadata("design:type", String)
], Vehiculo.prototype, "placa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60 }),
    __metadata("design:type", String)
], Vehiculo.prototype, "marca", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60 }),
    __metadata("design:type", String)
], Vehiculo.prototype, "modelo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], Vehiculo.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'km_actual', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Vehiculo.prototype, "kmActual", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], Vehiculo.prototype, "capacidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'num_motor', type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Vehiculo.prototype, "numMotor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'num_chasis', type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Vehiculo.prototype, "numChasis", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'foto_url', type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], Vehiculo.prototype, "fotoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado_semaforo',
        type: 'enum',
        enum: EstadoSemaforo,
        default: EstadoSemaforo.VERDE,
    }),
    __metadata("design:type", String)
], Vehiculo.prototype, "estadoSemaforo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Vehiculo.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => documento_legal_entity_1.DocumentoLegal, (doc) => doc.vehiculo),
    __metadata("design:type", Array)
], Vehiculo.prototype, "documentos", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Vehiculo.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Vehiculo.prototype, "updatedAt", void 0);
exports.Vehiculo = Vehiculo = __decorate([
    (0, typeorm_1.Entity)('vehiculo')
], Vehiculo);
//# sourceMappingURL=vehiculo.entity.js.map