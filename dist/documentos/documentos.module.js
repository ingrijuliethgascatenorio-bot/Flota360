"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const documento_legal_entity_1 = require("./documento-legal.entity");
const documentos_service_1 = require("./documentos.service");
const documentos_controller_1 = require("./documentos.controller");
const vehiculos_module_1 = require("../vehiculos/vehiculos.module");
const alertas_module_1 = require("../alertas/alertas.module");
let DocumentosModule = class DocumentosModule {
};
exports.DocumentosModule = DocumentosModule;
exports.DocumentosModule = DocumentosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([documento_legal_entity_1.DocumentoLegal]), vehiculos_module_1.VehiculosModule, alertas_module_1.AlertasModule],
        providers: [documentos_service_1.DocumentosService],
        controllers: [documentos_controller_1.DocumentosController],
    })
], DocumentosModule);
//# sourceMappingURL=documentos.module.js.map