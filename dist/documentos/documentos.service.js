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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const documento_legal_entity_1 = require("./documento-legal.entity");
const vehiculos_service_1 = require("../vehiculos/vehiculos.service");
const alertas_service_1 = require("../alertas/alertas.service");
let DocumentosService = class DocumentosService {
    repo;
    vehiculosService;
    alertasService;
    constructor(repo, vehiculosService, alertasService) {
        this.repo = repo;
        this.vehiculosService = vehiculosService;
        this.alertasService = alertasService;
    }
    async crear(vehiculoId, dto) {
        const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);
        const existe = await this.repo.findOne({
            where: { vehiculo: { id: vehiculoId }, tipo: dto.tipo },
        });
        if (existe) {
            throw new common_1.ConflictException(`El vehículo ya tiene un documento ${dto.tipo}. Use PATCH para actualizarlo.`);
        }
        const doc = this.repo.create({
            vehiculo,
            tipo: dto.tipo,
            fechaVencimiento: dto.fechaVencimiento,
            archivoUrl: dto.archivoUrl ?? null,
        });
        const guardado = await this.repo.save(doc);
        await this.alertasService.evaluarAlertasDocumentos(vehiculoId);
        return guardado;
    }
    async listarPorVehiculo(vehiculoId) {
        await this.vehiculosService.buscarPorId(vehiculoId);
        return this.repo.find({
            where: { vehiculo: { id: vehiculoId } },
            order: { tipo: 'ASC' },
        });
    }
    async actualizar(vehiculoId, tipo, dto) {
        const doc = await this.repo.findOne({
            where: { vehiculo: { id: vehiculoId }, tipo: tipo },
        });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${tipo} no encontrado para este vehículo`);
        if (dto.fechaVencimiento)
            doc.fechaVencimiento = dto.fechaVencimiento;
        if (dto.archivoUrl)
            doc.archivoUrl = dto.archivoUrl;
        doc.vencido = false;
        const actualizado = await this.repo.save(doc);
        await this.alertasService.limpiarAlertasDocumento(doc.id);
        await this.alertasService.evaluarAlertasDocumentos(vehiculoId);
        return actualizado;
    }
};
exports.DocumentosService = DocumentosService;
exports.DocumentosService = DocumentosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(documento_legal_entity_1.DocumentoLegal)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        vehiculos_service_1.VehiculosService,
        alertas_service_1.AlertasService])
], DocumentosService);
//# sourceMappingURL=documentos.service.js.map