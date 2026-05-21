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
exports.OrdenesController = void 0;
const common_1 = require("@nestjs/common");
const ordenes_service_1 = require("./ordenes.service");
const create_orden_dto_1 = require("./dto/create-orden.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let OrdenesController = class OrdenesController {
    service;
    constructor(service) {
        this.service = service;
    }
    crear(dto) {
        return this.service.crear(dto);
    }
    listar(vehiculoId) {
        return this.service.listar(vehiculoId ? +vehiculoId : undefined);
    }
    buscar(id) {
        return this.service.buscarPorId(id);
    }
    cambiarEstado(id, dto, req) {
        return this.service.cambiarEstado(id, dto, req.user.rol);
    }
    actualizarCostos(id, dto) {
        return this.service.actualizarCostos(id, dto);
    }
    eliminar(id) {
        return this.service.eliminar(id);
    }
    agregarRepuestos(id, repuestos) {
        return this.service.agregarRepuestos(id, repuestos);
    }
};
exports.OrdenesController = OrdenesController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_orden_dto_1.CreateOrdenDto]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "crear", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('vehiculoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "listar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "buscar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Patch)(':id/estado'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_orden_dto_1.UpdateEstadoDto, Object]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "cambiarEstado", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Patch)(':id/costos'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_orden_dto_1.UpdateCostosDto]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "actualizarCostos", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "eliminar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Post)(':id/repuestos'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", void 0)
], OrdenesController.prototype, "agregarRepuestos", null);
exports.OrdenesController = OrdenesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('ordenes'),
    __metadata("design:paramtypes", [ordenes_service_1.OrdenesService])
], OrdenesController);
//# sourceMappingURL=ordenes.controller.js.map