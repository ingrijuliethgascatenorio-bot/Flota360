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
exports.Usuario = exports.RolUsuario = void 0;
const typeorm_1 = require("typeorm");
var RolUsuario;
(function (RolUsuario) {
    RolUsuario["ADMINISTRADOR"] = "Administrador";
    RolUsuario["TECNICO"] = "Tecnico";
    RolUsuario["CONDUCTOR"] = "Conductor";
})(RolUsuario || (exports.RolUsuario = RolUsuario = {}));
let Usuario = class Usuario {
    id;
    nombre;
    correo;
    contrasenaHash;
    rol;
    activo;
    intentosFallidos;
    bloqueadoHasta;
    ultimoAcceso;
    createdAt;
    updatedAt;
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Usuario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Usuario.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "correo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contrasena_hash', length: 255 }),
    __metadata("design:type", String)
], Usuario.prototype, "contrasenaHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RolUsuario }),
    __metadata("design:type", String)
], Usuario.prototype, "rol", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'intentos_fallidos', default: 0 }),
    __metadata("design:type", Number)
], Usuario.prototype, "intentosFallidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bloqueado_hasta', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "bloqueadoHasta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_acceso', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "ultimoAcceso", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Usuario.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Usuario.prototype, "updatedAt", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('usuario')
], Usuario);
//# sourceMappingURL=usuario.entity.js.map