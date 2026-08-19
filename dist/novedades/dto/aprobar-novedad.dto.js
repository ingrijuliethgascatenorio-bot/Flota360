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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiltrarNovedadesDto = exports.RechazarNovedadDto = exports.AprobarNovedadDto = void 0;
const class_validator_1 = require("class-validator");
const estado_novedad_enum_1 = require("../enums/estado-novedad.enum");
class AprobarNovedadDto {
    tecnicoId;
    observacion;
}
exports.AprobarNovedadDto = AprobarNovedadDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AprobarNovedadDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], AprobarNovedadDto.prototype, "observacion", void 0);
class RechazarNovedadDto {
    observacion;
}
exports.RechazarNovedadDto = RechazarNovedadDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], RechazarNovedadDto.prototype, "observacion", void 0);
class FiltrarNovedadesDto {
    estado;
    vehiculoId;
    desde;
    hasta;
}
exports.FiltrarNovedadesDto = FiltrarNovedadesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrarNovedadesDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FiltrarNovedadesDto.prototype, "vehiculoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrarNovedadesDto.prototype, "desde", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrarNovedadesDto.prototype, "hasta", void 0);
//# sourceMappingURL=aprobar-novedad.dto.js.map