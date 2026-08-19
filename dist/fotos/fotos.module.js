"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FotosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const foto_orden_entity_1 = require("./foto-orden.entity");
const fotos_service_1 = require("./fotos.service");
const fotos_controller_1 = require("./fotos.controller");
const orden_trabajo_entity_1 = require("../ordenes/orden-trabajo.entity");
let FotosModule = class FotosModule {
};
exports.FotosModule = FotosModule;
exports.FotosModule = FotosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([foto_orden_entity_1.FotoOrden, orden_trabajo_entity_1.OrdenTrabajo]),
            platform_express_1.MulterModule.register({ dest: process.env.UPLOAD_TEMP_DIR ?? 'uploads/temp' }),
        ],
        providers: [fotos_service_1.FotosService],
        controllers: [fotos_controller_1.FotosController],
        exports: [fotos_service_1.FotosService],
    })
], FotosModule);
//# sourceMappingURL=fotos.module.js.map