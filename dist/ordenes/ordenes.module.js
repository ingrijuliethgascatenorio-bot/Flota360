"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdenesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const orden_trabajo_entity_1 = require("./orden-trabajo.entity");
const repuesto_orden_entity_1 = require("./repuesto-orden.entity");
const documento_legal_entity_1 = require("../documentos/documento-legal.entity");
const asignacion_conductor_entity_1 = require("../asignaciones/asignacion_conductor.entity");
const plan_mantenimiento_entity_1 = require("../planes/plan-mantenimiento.entity");
const novedad_entity_1 = require("../novedades/entities/novedad.entity");
const ordenes_service_1 = require("./ordenes.service");
const ordenes_controller_1 = require("./ordenes.controller");
const conductores_mantenimientos_controller_1 = require("./conductores-mantenimientos.controller");
const disponibilidad_service_1 = require("./disponibilidad.service");
const planes_module_1 = require("../planes/planes.module");
let OrdenesModule = class OrdenesModule {
};
exports.OrdenesModule = OrdenesModule;
exports.OrdenesModule = OrdenesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                orden_trabajo_entity_1.OrdenTrabajo,
                repuesto_orden_entity_1.RepuestoOrden,
                documento_legal_entity_1.DocumentoLegal,
                asignacion_conductor_entity_1.AsignacionConductor,
                plan_mantenimiento_entity_1.PlanMantenimiento,
                novedad_entity_1.Novedad,
            ]),
            planes_module_1.PlanesModule,
        ],
        providers: [ordenes_service_1.OrdenesService, disponibilidad_service_1.DisponibilidadService],
        controllers: [ordenes_controller_1.OrdenesController, conductores_mantenimientos_controller_1.ConductoresMantenimientosController],
        exports: [ordenes_service_1.OrdenesService, disponibilidad_service_1.DisponibilidadService],
    })
], OrdenesModule);
//# sourceMappingURL=ordenes.module.js.map