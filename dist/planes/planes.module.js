"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const plan_mantenimiento_entity_1 = require("./plan-mantenimiento.entity");
const planes_service_1 = require("./planes.service");
const planes_controller_1 = require("./planes.controller");
const vehiculos_module_1 = require("../vehiculos/vehiculos.module");
const alerta_entity_1 = require("../alertas/alerta.entity");
const vehiculo_entity_1 = require("../vehiculos/vehiculo.entity");
let PlanesModule = class PlanesModule {
};
exports.PlanesModule = PlanesModule;
exports.PlanesModule = PlanesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([plan_mantenimiento_entity_1.PlanMantenimiento, alerta_entity_1.Alerta, vehiculo_entity_1.Vehiculo]),
            vehiculos_module_1.VehiculosModule,
        ],
        providers: [planes_service_1.PlanesService],
        controllers: [planes_controller_1.PlanesController],
        exports: [planes_service_1.PlanesService],
    })
], PlanesModule);
//# sourceMappingURL=planes.module.js.map