"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovedadesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const novedad_entity_1 = require("./entities/novedad.entity");
const novedades_service_1 = require("./novedades.service");
const novedades_controller_1 = require("./novedades.controller");
const asignaciones_module_1 = require("../asignaciones/asignaciones.module");
const ordenes_module_1 = require("../ordenes/ordenes.module");
let NovedadesModule = class NovedadesModule {
};
exports.NovedadesModule = NovedadesModule;
exports.NovedadesModule = NovedadesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([novedad_entity_1.Novedad]),
            asignaciones_module_1.AsignacionesModule,
            ordenes_module_1.OrdenesModule,
        ],
        providers: [novedades_service_1.NovedadesService],
        controllers: [novedades_controller_1.NovedadesController],
        exports: [novedades_service_1.NovedadesService],
    })
], NovedadesModule);
//# sourceMappingURL=novedades.module.js.map