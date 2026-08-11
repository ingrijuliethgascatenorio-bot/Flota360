"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
                origin === 'null') {
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