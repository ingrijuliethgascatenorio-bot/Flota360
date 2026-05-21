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
exports.CreateVehiculoDto = void 0;
const class_validator_1 = require("class-validator");
const anioActual = new Date().getFullYear();
class CreateVehiculoDto {
    placa;
    marca;
    modelo;
    anio;
    kmActual;
    capacidad;
    numMotor;
    numChasis;
    venceSoat;
    venceTecnomecanica;
    fotoUrl;
}
exports.CreateVehiculoDto = CreateVehiculoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 10),
    (0, class_validator_1.Matches)(/^[A-Z0-9]+$/, { message: 'La placa solo puede tener letras mayúsculas y números' }),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "placa", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "marca", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "modelo", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1990, { message: 'El año mínimo es 1990' }),
    (0, class_validator_1.Max)(anioActual, { message: `El año no puede ser mayor a ${anioActual}` }),
    __metadata("design:type", Number)
], CreateVehiculoDto.prototype, "anio", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVehiculoDto.prototype, "kmActual", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateVehiculoDto.prototype, "capacidad", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "numMotor", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "numChasis", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de vencimiento del SOAT debe ser AAAA-MM-DD' }),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "venceSoat", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de vencimiento de la Tecnomecánica debe ser AAAA-MM-DD' }),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "venceTecnomecanica", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'La URL de la foto no es válida' }),
    __metadata("design:type", String)
], CreateVehiculoDto.prototype, "fotoUrl", void 0);
//# sourceMappingURL=create-vehiculo.dto.js.map