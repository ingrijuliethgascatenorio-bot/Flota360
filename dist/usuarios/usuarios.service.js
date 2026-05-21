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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const usuario_entity_1 = require("./usuario.entity");
let UsuariosService = class UsuariosService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async crear(dto) {
        const existe = await this.repo.findOne({ where: { correo: dto.correo } });
        if (existe)
            throw new common_1.ConflictException('Ya existe un usuario con ese correo');
        const hash = await bcrypt.hash(dto.contrasena, 12);
        const usuario = this.repo.create({
            nombre: dto.nombre,
            correo: dto.correo,
            contrasenaHash: hash,
            rol: dto.rol,
        });
        const guardado = await this.repo.save(usuario);
        return this.omitirHash(guardado);
    }
    async listar() {
        const usuarios = await this.repo.find({ order: { createdAt: 'DESC' } });
        return usuarios.map(this.omitirHash);
    }
    async buscarPorId(id) {
        const usuario = await this.repo.findOne({ where: { id } });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario #${id} no encontrado`);
        return this.omitirHash(usuario);
    }
    async buscarPorCorreo(correo) {
        return this.repo.findOne({ where: { correo } });
    }
    async actualizar(id, dto) {
        const usuario = await this.repo.findOne({ where: { id } });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario #${id} no encontrado`);
        if (dto.contrasena) {
            usuario.contrasenaHash = await bcrypt.hash(dto.contrasena, 12);
        }
        if (dto.nombre)
            usuario.nombre = dto.nombre;
        if (dto.rol)
            usuario.rol = dto.rol;
        if (dto.activo !== undefined)
            usuario.activo = dto.activo;
        const actualizado = await this.repo.save(usuario);
        return this.omitirHash(actualizado);
    }
    async eliminar(id) {
        const usuario = await this.repo.findOne({ where: { id } });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario #${id} no encontrado`);
        await this.repo.remove(usuario);
    }
    async incrementarIntentos(id) {
        const usuario = await this.repo.findOne({ where: { id } });
        if (!usuario)
            return;
        usuario.intentosFallidos += 1;
        if (usuario.intentosFallidos >= 5) {
            const bloqueo = new Date();
            bloqueo.setMinutes(bloqueo.getMinutes() + 10);
            usuario.bloqueadoHasta = bloqueo;
            usuario.intentosFallidos = 0;
        }
        await this.repo.save(usuario);
    }
    async resetearIntentos(id) {
        await this.repo.update(id, {
            intentosFallidos: 0,
            bloqueadoHasta: null,
            ultimoAcceso: new Date(),
        });
    }
    omitirHash(u) {
        const { contrasenaHash, ...resto } = u;
        return resto;
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map