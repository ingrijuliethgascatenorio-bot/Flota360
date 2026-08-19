"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrediccionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const prediccion_vehiculo_entity_1 = require("./prediccion-vehiculo.entity");
const prediccion_service_1 = require("./prediccion.service");
const prediccion_controller_1 = require("./prediccion.controller");
const alerta_entity_1 = require("../alertas/alerta.entity");
let PrediccionModule = class PrediccionModule {
};
exports.PrediccionModule = PrediccionModule;
exports.PrediccionModule = PrediccionModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([prediccion_vehiculo_entity_1.PrediccionVehiculo, alerta_entity_1.Alerta])],
        providers: [prediccion_service_1.PrediccionService],
        controllers: [prediccion_controller_1.PrediccionController],
        exports: [prediccion_service_1.PrediccionService],
    })
], PrediccionModule);
//# sourceMappingURL=prediccion.module.js.map