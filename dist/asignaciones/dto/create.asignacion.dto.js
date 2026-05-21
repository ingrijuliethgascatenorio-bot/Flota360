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
exports.CreateAsignacionDto = void 0;
const class_validator_1 = require("class-validator");
const asignacion_conductor_entity_1 = require("../asignacion_conductor.entity");
class CreateAsignacionDto {
    vehiculoId;
    conductorId;
    turno;
    fechaInicio;
    fechaFin;
    observaciones;
}
exports.CreateAsignacionDto = CreateAsignacionDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAsignacionDto.prototype, "vehiculoId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAsignacionDto.prototype, "conductorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(asignacion_conductor_entity_1.TurnoAsignacion),
    __metadata("design:type", String)
], CreateAsignacionDto.prototype, "turno", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAsignacionDto.prototype, "fechaInicio", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAsignacionDto.prototype, "fechaFin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAsignacionDto.prototype, "observaciones", void 0);
//# sourceMappingURL=create.asignacion.dto.js.map