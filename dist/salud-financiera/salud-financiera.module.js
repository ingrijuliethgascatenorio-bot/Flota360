"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaludFinancieraModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const salud_financiera_entity_1 = require("./salud-financiera.entity");
const salud_financiera_service_1 = require("./salud-financiera.service");
const salud_financiera_controller_1 = require("./salud-financiera.controller");
let SaludFinancieraModule = class SaludFinancieraModule {
};
exports.SaludFinancieraModule = SaludFinancieraModule;
exports.SaludFinancieraModule = SaludFinancieraModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([salud_financiera_entity_1.SaludFinanciera])],
        providers: [salud_financiera_service_1.SaludFinancieraService],
        controllers: [salud_financiera_controller_1.SaludFinancieraController],
        exports: [salud_financiera_service_1.SaludFinancieraService],
    })
], SaludFinancieraModule);
//# sourceMappingURL=salud-financiera.module.js.map