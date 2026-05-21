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
exports.CreateRegistroKmDto = void 0;
const class_validator_1 = require("class-validator");
const registro_km_entity_1 = require("../registro-km.entity");
class CreateRegistroKmDto {
    kmValor;
    momento;
}
exports.CreateRegistroKmDto = CreateRegistroKmDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRegistroKmDto.prototype, "kmValor", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(registro_km_entity_1.MomentoKm, { message: 'momento debe ser: inicio o fin' }),
    __metadata("design:type", String)
], CreateRegistroKmDto.prototype, "momento", void 0);
//# sourceMappingURL=create-registro-km.dto.js.map