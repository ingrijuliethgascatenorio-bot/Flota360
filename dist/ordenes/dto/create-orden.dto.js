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
exports.UpdateCostosDto = exports.UpdateEstadoDto = exports.CreateOrdenDto = exports.RepuestoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const orden_trabajo_entity_1 = require("../orden-trabajo.entity");
class RepuestoDto {
    nombreRepuesto;
    cantidad;
    precioUnitario;
}
exports.RepuestoDto = RepuestoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RepuestoDto.prototype, "nombreRepuesto", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RepuestoDto.prototype, "cantidad", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RepuestoDto.prototype, "precioUnitario", void 0);
class CreateOrdenDto {
    vehiculoId;
    tecnicoId;
    tipoMantenimiento;
    fechaOrden;
    planId;
    descripcion;
    costoManoObra;
    repuestos;
}
exports.CreateOrdenDto = CreateOrdenDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOrdenDto.prototype, "vehiculoId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOrdenDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(orden_trabajo_entity_1.TipoMantenimiento),
    __metadata("design:type", String)
], CreateOrdenDto.prototype, "tipoMantenimiento", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateOrdenDto.prototype, "fechaOrden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOrdenDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrdenDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrdenDto.prototype, "costoManoObra", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RepuestoDto),
    __metadata("design:type", Array)
], CreateOrdenDto.prototype, "repuestos", void 0);
class UpdateEstadoDto {
    estado;
}
exports.UpdateEstadoDto = UpdateEstadoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEstadoDto.prototype, "estado", void 0);
class UpdateCostosDto {
    costoManoObra;
    descripcion;
    repuestos;
}
exports.UpdateCostosDto = UpdateCostosDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateCostosDto.prototype, "costoManoObra", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCostosDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RepuestoDto),
    __metadata("design:type", Array)
], UpdateCostosDto.prototype, "repuestos", void 0);
//# sourceMappingURL=create-orden.dto.js.map