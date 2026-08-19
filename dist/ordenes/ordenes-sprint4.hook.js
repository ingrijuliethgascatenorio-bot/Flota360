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
exports.OrdenesHookService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const orden_trabajo_entity_1 = require("../ordenes/orden-trabajo.entity");
const salud_financiera_service_1 = require("../salud-financiera/salud-financiera.service");
const prediccion_service_1 = require("../prediccion/prediccion.service");
let OrdenesHookService = class OrdenesHookService {
    ordenRepo;
    saludService;
    prediccionService;
    constructor(ordenRepo, saludService, prediccionService) {
        this.ordenRepo = ordenRepo;
        this.saludService = saludService;
        this.prediccionService = prediccionService;
    }
    async onOrdenCerrada(ordenId) {
        const orden = await this.ordenRepo.findOne({
            where: { id: ordenId, estado: orden_trabajo_entity_1.EstadoOrden.CERRADA },
            relations: ['vehiculo'],
        });
        if (!orden)
            return;
        await Promise.allSettled([
            this.saludService.recalcularPorVehiculo(orden.vehiculo.id),
            this.prediccionService.calcularPrediccion(orden.vehiculo.id),
        ]);
    }
};
exports.OrdenesHookService = OrdenesHookService;
exports.OrdenesHookService = OrdenesHookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(orden_trabajo_entity_1.OrdenTrabajo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        salud_financiera_service_1.SaludFinancieraService,
        prediccion_service_1.PrediccionService])
], OrdenesHookService);
//# sourceMappingURL=ordenes-sprint4.hook.js.map