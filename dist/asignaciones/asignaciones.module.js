"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsignacionesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const asignacion_conductor_entity_1 = require("./asignacion_conductor.entity");
const asignaciones_service_1 = require("./asignaciones.service");
const asignaciones_controller_1 = require("./asignaciones.controller");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
let AsignacionesModule = class AsignacionesModule {
};
exports.AsignacionesModule = AsignacionesModule;
exports.AsignacionesModule = AsignacionesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([asignacion_conductor_entity_1.AsignacionConductor, documento_legal_entity_1.DocumentoLegal])],
        providers: [asignaciones_service_1.AsignacionesService],
        controllers: [asignaciones_controller_1.AsignacionesController],
        exports: [asignaciones_service_1.AsignacionesService],
    })
], AsignacionesModule);
//# sourceMappingURL=asignaciones.module.js.map