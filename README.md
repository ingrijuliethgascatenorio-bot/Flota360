# FlotaControl (Flota360)

Este es el backend oficial del proyecto **FlotaControl** (parte de la suite Flota360), una solución integral para la gestión, control y mantenimiento de flotas de vehículos. El backend está construido utilizando una arquitectura robusta y moderna basada en Node.js, empleando el framework NestJS.

## 🚀 Tecnologías Principales

El proyecto utiliza un stack tecnológico moderno para asegurar escalabilidad, mantenibilidad y un alto rendimiento:

- **Framework:** [NestJS](https://nestjs.com/) (v11)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [TypeORM](https://typeorm.io/)
- **Autenticación:** JWT (JSON Web Tokens) mediante `Passport`
- **Seguridad:** Encriptación de contraseñas con `Bcrypt`

## 📁 Estructura de Módulos

El backend está organizado de manera modular para separar dominios de negocio. Entre los principales módulos se incluyen:

- `alertas`: Gestión y emisión de notificaciones de mantenimiento o eventos.
- `asignaciones`: Control de asignaciones de vehículos a conductores.
- `auth`: Autenticación, autorización y control de acceso de usuarios.
- `dashboard`: Proveedor de métricas y datos consolidados para la interfaz gráfica.
- `documentos` y `fotos`: Gestión de archivos y comprobantes adjuntos a vehículos o novedades.
- `kilometraje`: Registro y trazabilidad del recorrido de la flota.
- `novedades`: Registro de eventualidades, incidentes o reportes por parte de conductores.
- `ordenes`: Gestión de órdenes de mantenimiento y reparaciones.
- `planes`: Mantenimientos programados.
- `prediccion`: Estimaciones (ej. próximo mantenimiento basado en kilometraje o fechas).
- `reportes`: Generación de informes operativos y gerenciales.
- `salud-financiera`: Control de gastos de reparación y costos asociados a la flota.
- `usuarios`: Gestión de perfiles y roles del sistema.
- `vehiculos`: Maestro y hoja de vida de la flota.

## 🛠️ Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1. **Clonar el repositorio y navegar a la carpeta del backend**
   ```bash
   cd backend
   ```

2. **Instalar las dependencias**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno**
   - Asegúrate de tener un archivo `.env` configurado en la raíz del proyecto backend basado en la configuración de la base de datos PostgreSQL. Las variables típicas incluyen conexión a la DB, secretos JWT, y puerto.

4. **Ejecutar la aplicación en modo desarrollo**
   ```bash
   npm run start:dev
   ```

## 🏗️ Comandos Disponibles

- `npm run build`: Compila el proyecto en la carpeta `dist/`.
- `npm run format`: Formatea el código usando Prettier.
- `npm run lint`: Analiza y corrige problemas en el código con ESLint.
- `npm run start:dev`: Inicia el servidor con recarga en caliente (watch mode).
- `npm run start:prod`: Inicia el servidor en entorno de producción.
- `npm test`: Ejecuta pruebas unitarias (Jest).

## 🔒 Seguridad y Autenticación

Todas las rutas privadas del API están protegidas con **Guards** de NestJS que validan el token JWT. Las contraseñas en la base de datos están hasheadas utilizando Bcrypt.

## 👨‍💻 Autor y Licencia
- **Proyecto**: Flota360 - FlotaControl
- **Uso**: Privado (UNLICENSED)
