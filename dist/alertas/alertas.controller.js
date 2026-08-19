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
exports.AlertasController = void 0;
const common_1 = require("@nestjs/common");
const alertas_service_1 = require("./alertas.service");
const filtrar_alertas_dto_1 = require("./dto/filtrar-alertas.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let AlertasController = class AlertasController {
    alertasService;
    constructor(alertasService) {
        this.alertasService = alertasService;
    }
    async getUmbrales() {
        const data = await this.alertasService.getUmbrales();
        return { data };
    }
    async updateUmbrales(dto) {
        const data = await this.alertasService.actualizarUmbrales(dto.km, dto.dias);
        return { message: 'Umbrales actualizados', data };
    }
    async listarAlertas(vehiculoId, filtrosDto, req) {
        const filtro = filtrosDto.filtro ?? filtrar_alertas_dto_1.FiltroAlerta.TODAS;
        const soloNoLeidas = filtrosDto.soloNoLeidas ?? true;
        const alertas = await this.alertasService.listarAlertas(vehiculoId, filtro, soloNoLeidas, req.user.rol);
        return { data: alertas, total: alertas.length };
    }
    async marcarLeida(vehiculoId, alertaId) {
        const data = await this.alertasService.marcarLeida(alertaId, vehiculoId);
        return { data };
    }
    async evaluarVehiculo(vehiculoId) {
        const [mant, doc] = await Promise.all([
            this.alertasService.evaluarAlertasMantenimiento(vehiculoId),
            this.alertasService.evaluarAlertasDocumentos(vehiculoId),
        ]);
        return {
            message: 'Evaluación completada',
            data: {
                alertas_mantenimiento: mant,
                alertas_documentos: doc,
                total_generadas: mant.length + doc.length,
            },
        };
    }
};
exports.AlertasController = AlertasController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Get)('alertas/umbrales'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlertasController.prototype, "getUmbrales", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Put)('alertas/umbrales'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrar_alertas_dto_1.UpdateUmbralesDto]),
    __metadata("design:returntype", Promise)
], AlertasController.prototype, "updateUmbrales", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)('vehiculos/:vehiculoId/alertas'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, filtrar_alertas_dto_1.FiltrarAlertasDto, Object]),
    __metadata("design:returntype", Promise)
], AlertasController.prototype, "listarAlertas", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Patch)('vehiculos/:vehiculoId/alertas/:alertaId/leer'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('alertaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AlertasController.prototype, "marcarLeida", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Post)('vehiculos/:vehiculoId/alertas/evaluar'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AlertasController.prototype, "evaluarVehiculo", null);
exports.AlertasController = AlertasController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [alertas_service_1.AlertasService])
], AlertasController);
//# sourceMappingURL=alertas.controller.js.map