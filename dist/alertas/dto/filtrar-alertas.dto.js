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
exports.UpdateUmbralesDto = exports.FiltrarAlertasDto = exports.FiltroAlerta = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var FiltroAlerta;
(function (FiltroAlerta) {
    FiltroAlerta["MANTENIMIENTO"] = "mantenimiento";
    FiltroAlerta["DOCUMENTO"] = "documento";
    FiltroAlerta["TODAS"] = "todas";
})(FiltroAlerta || (exports.FiltroAlerta = FiltroAlerta = {}));
class FiltrarAlertasDto {
    filtro = FiltroAlerta.TODAS;
    soloNoLeidas = true;
}
exports.FiltrarAlertasDto = FiltrarAlertasDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FiltroAlerta),
    __metadata("design:type", String)
], FiltrarAlertasDto.prototype, "filtro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value !== 'false'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FiltrarAlertasDto.prototype, "soloNoLeidas", void 0);
class UpdateUmbralesDto {
    km;
    dias;
}
exports.UpdateUmbralesDto = UpdateUmbralesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateUmbralesDto.prototype, "km", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateUmbralesDto.prototype, "dias", void 0);
//# sourceMappingURL=filtrar-alertas.dto.js.map