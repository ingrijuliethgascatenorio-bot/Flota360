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
exports.SaludFinancieraController = void 0;
const common_1 = require("@nestjs/common");
const salud_financiera_service_1 = require("./salud-financiera.service");
const filtro_reporte_dto_1 = require("../reportes/dto/filtro-reporte.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
let SaludFinancieraController = class SaludFinancieraController {
    saludService;
    constructor(saludService) {
        this.saludService = saludService;
    }
    async getInsights(periodo) {
        const data = await this.saludService.getInsights(periodo);
        return { data };
    }
    async getRanking(dto) {
        const data = await this.saludService.getRanking(dto.periodo);
        return { data, total: data.length };
    }
};
exports.SaludFinancieraController = SaludFinancieraController;
__decorate([
    (0, common_1.Get)('insights'),
    __param(0, (0, common_1.Query)('periodo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SaludFinancieraController.prototype, "getInsights", null);
__decorate([
    (0, common_1.Get)('ranking'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtro_reporte_dto_1.FiltroRankingDto]),
    __metadata("design:returntype", Promise)
], SaludFinancieraController.prototype, "getRanking", null);
exports.SaludFinancieraController = SaludFinancieraController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Controller)('salud-financiera'),
    __metadata("design:paramtypes", [salud_financiera_service_1.SaludFinancieraService])
], SaludFinancieraController);
//# sourceMappingURL=salud-financiera.controller.js.map