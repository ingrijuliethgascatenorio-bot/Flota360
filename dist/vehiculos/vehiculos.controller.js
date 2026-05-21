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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiculosController = void 0;
const common_1 = require("@nestjs/common");
const vehiculos_service_1 = require("./vehiculos.service");
const create_vehiculo_dto_1 = require("./dto/create-vehiculo.dto");
const update_vehiculo_dto_1 = require("./dto/update-vehiculo.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let VehiculosController = class VehiculosController {
    service;
    constructor(service) {
        this.service = service;
    }
    crear(dto) {
        return this.service.crear(dto);
    }
    listar() {
        return this.service.listar();
    }
    buscar(id) {
        return this.service.buscarPorId(id);
    }
    actualizar(id, dto) {
        return this.service.actualizar(id, dto);
    }
    eliminar(id) {
        return this.service.eliminar(id);
    }
};
exports.VehiculosController = VehiculosController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vehiculo_dto_1.CreateVehiculoDto]),
    __metadata("design:returntype", void 0)
], VehiculosController.prototype, "crear", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VehiculosController.prototype, "listar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VehiculosController.prototype, "buscar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_vehiculo_dto_1.UpdateVehiculoDto]),
    __metadata("design:returntype", void 0)
], VehiculosController.prototype, "actualizar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VehiculosController.prototype, "eliminar", null);
exports.VehiculosController = VehiculosController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('vehiculos'),
    __metadata("design:paramtypes", [vehiculos_service_1.VehiculosService])
], VehiculosController);
//# sourceMappingURL=vehiculos.controller.js.map