"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FotosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const fotos_service_1 = require("./fotos.service");
const subir_fotos_dto_1 = require("./dto/subir-fotos.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const usuario_entity_1 = require("../usuarios/usuario.entity");
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const multerStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        const tempDir = path.join(UPLOADS_ROOT, 'temp');
        import('fs')
            .then((fs) => {
            fs.mkdirSync(tempDir, { recursive: true });
            cb(null, tempDir);
        })
            .catch((err) => cb(err, ''));
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueId = crypto.randomBytes(12).toString('hex');
        cb(null, `${uniqueId}${ext}`);
    },
});
const multerFilter = (_req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png'];
    cb(null, permitidos.includes(file.mimetype));
};
let FotosController = class FotosController {
    fotosService;
    constructor(fotosService) {
        this.fotosService = fotosService;
    }
    async adjuntarFotos(ordenId, dto, archivos, req) {
        if (!archivos || archivos.length === 0) {
            throw new common_1.BadRequestException('Debe adjuntar al menos un archivo.');
        }
        const fotos = await this.fotosService.adjuntarFotos(ordenId, archivos.map((f) => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            path: f.path,
        })), dto.tipoFoto, req.user.id);
        return {
            message: `${fotos.length} foto(s) adjuntada(s) correctamente.`,
            data: fotos,
        };
    }
    async listarFotosPorOrden(ordenId) {
        const galeria = await this.fotosService.listarPorOrden(ordenId);
        return { data: galeria };
    }
    async eliminarFoto(ordenId, fotoId) {
        const resultado = await this.fotosService.eliminar(fotoId, ordenId);
        return { message: 'Foto eliminada.', data: resultado };
    }
    async historialFotosPorVehiculo(vehiculoId) {
        const historial = await this.fotosService.historialPorVehiculo(vehiculoId);
        return { data: historial, total_ordenes: historial.length };
    }
};
exports.FotosController = FotosController;
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.TECNICO, usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Post)('ordenes/:ordenId/fotos'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 5, {
        storage: multerStorage,
        fileFilter: multerFilter,
        limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    })),
    __param(0, (0, common_1.Param)('ordenId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, subir_fotos_dto_1.SubirFotosDto, Array, Object]),
    __metadata("design:returntype", Promise)
], FotosController.prototype, "adjuntarFotos", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)('ordenes/:ordenId/fotos'),
    __param(0, (0, common_1.Param)('ordenId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FotosController.prototype, "listarFotosPorOrden", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.TECNICO, usuario_entity_1.RolUsuario.ADMINISTRADOR),
    (0, common_1.Delete)('ordenes/:ordenId/fotos/:fotoId'),
    __param(0, (0, common_1.Param)('ordenId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('fotoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FotosController.prototype, "eliminarFoto", null);
__decorate([
    (0, roles_decorator_1.Roles)(usuario_entity_1.RolUsuario.ADMINISTRADOR, usuario_entity_1.RolUsuario.TECNICO),
    (0, common_1.Get)('vehiculos/:vehiculoId/historial-fotos'),
    __param(0, (0, common_1.Param)('vehiculoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FotosController.prototype, "historialFotosPorVehiculo", null);
exports.FotosController = FotosController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [fotos_service_1.FotosService])
], FotosController);
//# sourceMappingURL=fotos.controller.js.map