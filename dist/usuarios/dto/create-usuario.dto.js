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
exports.CreateUsuarioDto = void 0;
const class_validator_1 = require("class-validator");
const usuario_entity_1 = require("../usuario.entity");
class CreateUsuarioDto {
    nombre;
    correo;
    contrasena;
    rol;
}
exports.CreateUsuarioDto = CreateUsuarioDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio' }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Correo inválido' }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "correo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener mínimo 8 caracteres' }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "contrasena", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(usuario_entity_1.RolUsuario, { message: 'Rol inválido' }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "rol", void 0);
//# sourceMappingURL=create-usuario.dto.js.map