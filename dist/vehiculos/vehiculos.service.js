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
exports.VehiculosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vehiculo_entity_1 = require("./vehiculo.entity");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
const alertas_service_1 = require("../alertas/alertas.service");
let VehiculosService = class VehiculosService {
    repo;
    documentoRepo;
    alertasService;
    constructor(repo, documentoRepo, alertasService) {
        this.repo = repo;
        this.documentoRepo = documentoRepo;
        this.alertasService = alertasService;
    }
    async crear(dto) {
        const existe = await this.repo.findOne({
            where: { placa: dto.placa.toUpperCase() },
        });
        if (existe)
            throw new common_1.ConflictException(`Ya existe un vehículo con la placa ${dto.placa}`);
        const { venceSoat, venceTecnomecanica, ...vehiculoData } = dto;
        const vehiculo = this.repo.create({
            ...vehiculoData,
            placa: dto.placa.toUpperCase(),
        });
        const guardado = await this.repo.save(vehiculo);
        await this.documentoRepo.save(this.documentoRepo.create({
            vehiculo: guardado,
            tipo: documento_legal_entity_1.TipoDocumento.SOAT,
            fechaVencimiento: venceSoat,
        }));
        await this.documentoRepo.save(this.documentoRepo.create({
            vehiculo: guardado,
            tipo: documento_legal_entity_1.TipoDocumento.REVISION_TM,
            fechaVencimiento: venceTecnomecanica,
        }));
        await this.alertasService.evaluarAlertasDocumentos(guardado.id);
        return this.buscarPorId(guardado.id);
    }
    async listar() {
        return this.repo.find({
            where: { activo: true },
            order: { createdAt: 'DESC' },
        });
    }
    async buscarPorId(id) {
        const vehiculo = await this.repo.findOne({
            where: { id },
            relations: ['documentos'],
        });
        if (!vehiculo)
            throw new common_1.NotFoundException(`Vehículo #${id} no encontrado`);
        return vehiculo;
    }
    async actualizar(id, dto) {
        const vehiculo = await this.buscarPorId(id);
        if (dto.placa && dto.placa.toUpperCase() !== vehiculo.placa) {
            const existe = await this.repo.findOne({
                where: { placa: dto.placa.toUpperCase() },
            });
            if (existe)
                throw new common_1.ConflictException(`La placa ${dto.placa} ya está registrada`);
        }
        const { venceSoat, venceTecnomecanica, ...vehiculoData } = dto;
        Object.assign(vehiculo, {
            ...vehiculoData,
            placa: dto.placa ? dto.placa.toUpperCase() : vehiculo.placa,
        });
        const guardado = await this.repo.save(vehiculo);
        if (venceSoat) {
            const docSoat = await this.documentoRepo.findOne({
                where: { vehiculo: { id }, tipo: documento_legal_entity_1.TipoDocumento.SOAT },
            });
            if (docSoat) {
                docSoat.fechaVencimiento = venceSoat;
                await this.documentoRepo.save(docSoat);
            }
            else {
                await this.documentoRepo.save(this.documentoRepo.create({
                    vehiculo: guardado,
                    tipo: documento_legal_entity_1.TipoDocumento.SOAT,
                    fechaVencimiento: venceSoat,
                }));
            }
        }
        if (venceTecnomecanica) {
            const docTM = await this.documentoRepo.findOne({
                where: { vehiculo: { id }, tipo: documento_legal_entity_1.TipoDocumento.REVISION_TM },
            });
            if (docTM) {
                docTM.fechaVencimiento = venceTecnomecanica;
                await this.documentoRepo.save(docTM);
            }
            else {
                await this.documentoRepo.save(this.documentoRepo.create({
                    vehiculo: guardado,
                    tipo: documento_legal_entity_1.TipoDocumento.REVISION_TM,
                    fechaVencimiento: venceTecnomecanica,
                }));
            }
        }
        if (venceSoat || venceTecnomecanica) {
            await this.alertasService.evaluarAlertasDocumentos(id);
        }
        return this.buscarPorId(id);
    }
    async eliminar(id) {
        const vehiculo = await this.buscarPorId(id);
        vehiculo.activo = false;
        await this.repo.save(vehiculo);
    }
};
exports.VehiculosService = VehiculosService;
exports.VehiculosService = VehiculosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vehiculo_entity_1.Vehiculo)),
    __param(1, (0, typeorm_1.InjectRepository)(documento_legal_entity_1.DocumentoLegal)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        alertas_service_1.AlertasService])
], VehiculosService);
//# sourceMappingURL=vehiculos.service.js.map