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
exports.PlanesController = void 0;
const common_1 = require("@nestjs/common");
const planes_service_1 = require("./planes.service");
const create_plan_dto_1 = require("./dto/create-plan.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let PlanesController = class PlanesController {
    service;
    constructor(service) {
        this.service = service;
    }
    crear(vehiculoId, dto) {
        return this.service.crear(vehiculoId, dto);
    }
    listar(vehiculoId) {
        return this.service.listarPorVehiculo(vehiculoId);
    }
    desactivar(id) {
        return this.service.desactivar(id);
    }
};
exports.PlanesController = PlanesController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_plan_dto_1.CreatePlanDto]),
    __metadata("design:returntype", void 0)
], PlanesController.prototype, "crear", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PlanesController.prototype, "listar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PlanesController.prototype, "desactivar", null);
exports.PlanesController = PlanesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('vehiculos/:vehiculoId/planes'),
    __metadata("design:paramtypes", [planes_service_1.PlanesService])
], PlanesController);
//# sourceMappingURL=planes.controller.js.map