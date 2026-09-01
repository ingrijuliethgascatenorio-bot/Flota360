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
exports.ConductoresMantenimientosController = void 0;
const common_1 = require("@nestjs/common");
const ordenes_service_1 = require("./ordenes.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let ConductoresMantenimientosController = class ConductoresMantenimientosController {
    service;
    constructor(service) {
        this.service = service;
    }
    misMantenimientos(req) {
        return this.service.listarPorConductor(req.user.id);
    }
    detalleMantenimiento(req, id) {
        return this.service.buscarPorConductor(req.user.id, id);
    }
};
exports.ConductoresMantenimientosController = ConductoresMantenimientosController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConductoresMantenimientosController.prototype, "misMantenimientos", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], ConductoresMantenimientosController.prototype, "detalleMantenimiento", null);
exports.ConductoresMantenimientosController = ConductoresMantenimientosController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('conductores/mis-mantenimientos'),
    __metadata("design:paramtypes", [ordenes_service_1.OrdenesService])
], ConductoresMantenimientosController);
//# sourceMappingURL=conductores-mantenimientos.controller.js.map