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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const fs = __importStar(require("fs"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const uploadsPath = (0, path_1.join)(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath))
        fs.mkdirSync(uploadsPath, { recursive: true });
    const ordenesPath = (0, path_1.join)(uploadsPath, 'ordenes');
    if (!fs.existsSync(ordenesPath))
        fs.mkdirSync(ordenesPath, { recursive: true });
    const tempPath = (0, path_1.join)(uploadsPath, 'temp');
    if (!fs.existsSync(tempPath))
        fs.mkdirSync(tempPath, { recursive: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin ||
                origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1') ||
                origin.startsWith('http://192.168.') ||
                origin.startsWith('http://10.') ||
                origin.includes('ngrok') ||
                origin === 'null' ||
                origin.endsWith('julieth.site')) {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS bloqueado para: ${origin}`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'ngrok-skip-browser-warning',
        ],
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/api/uploads',
        setHeaders: (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'), {
        prefix: '/',
        index: false,
    });
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/', (_req, res) => {
        res.redirect('/pages/home.html');
    });
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3002;
    await app.listen(port, '0.0.0.0');
    console.log(`FlotaControl backend corriendo en puerto ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map