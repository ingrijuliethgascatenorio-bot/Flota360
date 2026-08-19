"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KilometrajeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const registro_km_entity_1 = require("./registro-km.entity");
const asignacion_conductor_entity_1 = require("../asignaciones/asignacion_conductor.entity");
const kilometraje_service_1 = require("./kilometraje.service");
const kilometraje_controller_1 = require("./kilometraje.controller");
const vehiculos_module_1 = require("../vehiculos/vehiculos.module");
const usuarios_module_1 = require("../usuarios/usuarios.module");
const planes_module_1 = require("../planes/planes.module");
const prediccion_module_1 = require("../prediccion/prediccion.module");
let KilometrajeModule = class KilometrajeModule {
};
exports.KilometrajeModule = KilometrajeModule;
exports.KilometrajeModule = KilometrajeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([registro_km_entity_1.RegistroKm, asignacion_conductor_entity_1.AsignacionConductor]),
            vehiculos_module_1.VehiculosModule,
            usuarios_module_1.UsuariosModule,
            planes_module_1.PlanesModule,
            prediccion_module_1.PrediccionModule,
        ],
        providers: [kilometraje_service_1.KilometrajeService],
        controllers: [kilometraje_controller_1.KilometrajeController, kilometraje_controller_1.ConductorKilometrajeController],
        exports: [kilometraje_service_1.KilometrajeService],
    })
], KilometrajeModule);
//# sourceMappingURL=kilometraje.module.js.map