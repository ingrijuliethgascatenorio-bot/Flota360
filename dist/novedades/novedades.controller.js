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
exports.NovedadesController = void 0;
const common_1 = require("@nestjs/common");
const novedades_service_1 = require("./novedades.service");
const create_novedad_dto_1 = require("./dto/create-novedad.dto");
const aprobar_novedad_dto_1 = require("./dto/aprobar-novedad.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let NovedadesController = class NovedadesController {
    service;
    constructor(service) {
        this.service = service;
    }
    crear(req, dto) {
        return this.service.crear(req.user.id, dto);
    }
    misNovedades(req) {
        return this.service.misNovedades(req.user.id);
    }
    listar(filtros) {
        return this.service.listar(filtros);
    }
    buscar(id) {
        return this.service.buscarPorId(id);
    }
    aprobar(id, dto) {
        return this.service.aprobar(id, dto);
    }
    rechazar(id, dto) {
        return this.service.rechazar(id, dto);
    }
};
exports.NovedadesController = NovedadesController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_novedad_dto_1.CreateNovedadDto]),
    __metadata("design:returntype", void 0)
], NovedadesController.prototype, "crear", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.CONDUCTOR),
    (0, common_1.Get)('mias'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NovedadesController.prototype, "misNovedades", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [aprobar_novedad_dto_1.FiltrarNovedadesDto]),
    __metadata("design:returntype", void 0)
], NovedadesController.prototype, "listar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], NovedadesController.prototype, "buscar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Patch)(':id/aprobar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, aprobar_novedad_dto_1.AprobarNovedadDto]),
    __metadata("design:returntype", void 0)
], NovedadesController.prototype, "aprobar", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Patch)(':id/rechazar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, aprobar_novedad_dto_1.RechazarNovedadDto]),
    __metadata("design:returntype", void 0)
], NovedadesController.prototype, "rechazar", null);
exports.NovedadesController = NovedadesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('novedades'),
    __metadata("design:paramtypes", [novedades_service_1.NovedadesService])
], NovedadesController);
//# sourceMappingURL=novedades.controller.js.map