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
var AlertasScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertasScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const alertas_service_1 = require("../alertas/alertas.service");
let AlertasScheduler = AlertasScheduler_1 = class AlertasScheduler {
    alertasService;
    logger = new common_1.Logger(AlertasScheduler_1.name);
    constructor(alertasService) {
        this.alertasService = alertasService;
    }
    async evaluarAlertasDiarias() {
        const inicio = Date.now();
        this.logger.log(`Iniciando evaluación diaria de alertas — ${new Date().toISOString()}`);
        try {
            const resultados = await this.alertasService.ejecutarEvaluacionGlobal();
            const totalGeneradas = resultados.reduce((acc, r) => acc + r.generadas, 0);
            this.logger.log(`Evaluación completada en ${Date.now() - inicio} ms. ` +
                `Vehículos procesados: ${resultados.length}. ` +
                `Alertas generadas: ${totalGeneradas}.`);
        }
        catch (err) {
            this.logger.error('Error crítico en evaluación de alertas:', err);
        }
    }
};
exports.AlertasScheduler = AlertasScheduler;
__decorate([
    (0, schedule_1.Cron)('0 6 * * *', { timeZone: 'America/Bogota' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlertasScheduler.prototype, "evaluarAlertasDiarias", null);
exports.AlertasScheduler = AlertasScheduler = AlertasScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [alertas_service_1.AlertasService])
], AlertasScheduler);
//# sourceMappingURL=alertas.scheduler.js.map