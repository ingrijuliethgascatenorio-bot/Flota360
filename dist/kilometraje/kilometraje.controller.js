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
exports.ConductorKilometrajeController = exports.KilometrajeController = void 0;
const common_1 = require("@nestjs/common");
const kilometraje_service_1 = require("./kilometraje.service");
const create_registro_km_dto_1 = require("./dto/create-registro-km.dto");
const cerrar_pendiente_dto_1 = require("./dto/cerrar-pendiente.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let KilometrajeController = class KilometrajeController {
    service;
    constructor(service) {
        this.service = service;
    }
    registrar(vehiculoId, req, dto) {
        return this.service.registrar(vehiculoId, req.user.id, dto);
    }
    historial(vehiculoId) {
        return this.service.historial(vehiculoId);
    }
    kmPorDia(vehiculoId) {
        return this.service.calcularKmPorDia(vehiculoId);
    }
    kmInicioEncadenado(vehiculoId, req) {
        return this.service.kmInicioEncadenado(vehiculoId, req.user.id);
    }
};
exports.KilometrajeController = KilometrajeController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR, usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, create_registro_km_dto_1.CreateRegistroKmDto]),
    __metadata("design:returntype", void 0)
], KilometrajeController.prototype, "registrar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO, usuario_entity_1.RolUsuario.CONDUCTOR),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], KilometrajeController.prototype, "historial", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)('km-por-dia'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], KilometrajeController.prototype, "kmPorDia", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR, usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Get)('km-inicio'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], KilometrajeController.prototype, "kmInicioEncadenado", null);
exports.KilometrajeController = KilometrajeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('vehiculos/:vehiculoId/kilometraje'),
    __metadata("design:paramtypes", [kilometraje_service_1.KilometrajeService])
], KilometrajeController);
let ConductorKilometrajeController = class ConductorKilometrajeController {
    service;
    constructor(service) {
        this.service = service;
    }
    historialConductor(conductorId) {
        return this.service.historialConductor(conductorId);
    }
    turnosPendientes(conductorId) {
        return this.service.turnosPendientes(conductorId);
    }
    cerrarPendiente(conductorId, registroInicioId, dto, req) {
        if (req.user.rol === usuario_entity_1.RolUsuario.CONDUCTOR && req.user.id !== conductorId) {
            throw new common_1.ForbiddenException('Solo puedes cerrar tus propios turnos');
        }
        return this.service.cerrarTurnoPendiente(conductorId, registroInicioId, dto);
    }
};
exports.ConductorKilometrajeController = ConductorKilometrajeController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO, usuario_entity_1.RolUsuario.CONDUCTOR),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('conductorId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ConductorKilometrajeController.prototype, "historialConductor", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR, usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Get)('pendientes'),
    __param(0, (0, common_1.Param)('conductorId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ConductorKilometrajeController.prototype, "turnosPendientes", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR, usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Post)('pendientes/:registroInicioId/cerrar'),
    __param(0, (0, common_1.Param)('conductorId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('registroInicioId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, cerrar_pendiente_dto_1.CerrarPendienteDto, Object]),
    __metadata("design:returntype", void 0)
], ConductorKilometrajeController.prototype, "cerrarPendiente", null);
exports.ConductorKilometrajeController = ConductorKilometrajeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('conductores/:conductorId/kilometraje'),
    __metadata("design:paramtypes", [kilometraje_service_1.KilometrajeService])
], ConductorKilometrajeController);
//# sourceMappingURL=kilometraje.controller.js.map