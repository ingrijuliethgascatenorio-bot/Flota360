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
exports.PrediccionController = void 0;
const common_1 = require("@nestjs/common");
const prediccion_service_1 = require("./prediccion.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let PrediccionController = class PrediccionController {
    prediccionService;
    constructor(prediccionService) {
        this.prediccionService = prediccionService;
    }
    async snapshotFlota() {
        const data = await this.prediccionService.getSnapshotFlota();
        return { data, total: data.length };
    }
    async snapshotVehiculo(vehiculoId) {
        const data = await this.prediccionService.getSnapshotVehiculo(vehiculoId);
        return { data };
    }
    async recalcular(vehiculoId) {
        const data = await this.prediccionService.calcularPrediccion(vehiculoId);
        return { message: 'Predicción recalculada', data };
    }
};
exports.PrediccionController = PrediccionController;
__decorate([
    (0, common_1.Get)('flota'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrediccionController.prototype, "snapshotFlota", null);
__decorate([
    (0, common_1.Get)('vehiculos/:vehiculoId'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PrediccionController.prototype, "snapshotVehiculo", null);
__decorate([
    (0, common_1.Post)('vehiculos/:vehiculoId/recalcular'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PrediccionController.prototype, "recalcular", null);
exports.PrediccionController = PrediccionController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Controller)('prediccion'),
    __metadata("design:paramtypes", [prediccion_service_1.PrediccionService])
], PrediccionController);
//# sourceMappingURL=prediccion.controller.js.map