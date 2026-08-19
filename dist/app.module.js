"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const usuarios_module_1 = require("./usuarios/usuarios.module");
const vehiculos_module_1 = require("./vehiculos/vehiculos.module");
const documentos_module_1 = require("./documentos/documentos.module");
const ordenes_module_1 = require("./ordenes/ordenes.module");
const fotos_module_1 = require("./fotos/fotos.module");
const alertas_module_1 = require("./alertas/alertas.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const kilometraje_module_1 = require("./kilometraje/kilometraje.module");
const asignaciones_module_1 = require("./asignaciones/asignaciones.module");
const reportes_module_1 = require("./reportes/reportes.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const prediccion_module_1 = require("./prediccion/prediccion.module");
const salud_financiera_module_1 = require("./salud-financiera/salud-financiera.module");
const novedades_module_1 = require("./novedades/novedades.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: +config.get('DB_PORT', '5432'),
                    username: config.get('DB_USERNAME', 'postgres'),
                    password: config.getOrThrow('DB_PASSWORD'),
                    database: config.get('DB_NAME', 'flotacontrol'),
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: config.get('NODE_ENV') === 'development',
                    ssl: {
                        rejectUnauthorized: false,
                    },
                    extra: {
                        options: '-c TimeZone=America/Bogota',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            usuarios_module_1.UsuariosModule,
            vehiculos_module_1.VehiculosModule,
            documentos_module_1.DocumentosModule,
            ordenes_module_1.OrdenesModule,
            fotos_module_1.FotosModule,
            alertas_module_1.AlertasModule,
            scheduler_module_1.SchedulerModule,
            kilometraje_module_1.KilometrajeModule,
            asignaciones_module_1.AsignacionesModule,
            reportes_module_1.ReportesModule,
            prediccion_module_1.PrediccionModule,
            salud_financiera_module_1.SaludFinancieraModule,
            novedades_module_1.NovedadesModule,
            dashboard_module_1.DashboardModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map