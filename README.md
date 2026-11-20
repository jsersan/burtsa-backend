# Burtsa Backend

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

**Burtsa Backend** es el servicio backend de [describe brevemente el producto o plataforma]. Expone una API REST/GraphQL para gestionar [usuarios, reservas, pagos, contenido, etc.] y se comunica con [base de datos, servicios externos, colas, etc.].

> Sustituye este párrafo por una descripción clara de 2–3 líneas: qué problema resuelve, para quién y qué funcionalidades principales ofrece.

## Tabla de contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Uso](#uso)
- [Scripts disponibles](#scripts-disponibles)
- [Documentación de la API](#documentación-de-la-api)
- [Base de datos](#base-de-datos)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Convenciones](#convenciones)
- [Contribuir](#contribuir)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)
- [Contacto](#contacto)

## Características

- API REST modular y versionada.
- Autenticación y autorización mediante [JWT / sesiones / OAuth].
- Gestión de usuarios, roles y permisos.
- Persistencia con [PostgreSQL / MySQL / MongoDB].
- Validación de datos de entrada.
- Manejo centralizado de errores.
- Logging estructurado.
- Documentación interactiva con [Swagger / OpenAPI / Postman].
- Tests unitarios y de integración.
- Configuración mediante variables de entorno.
- Soporte para [Docker / Docker Compose].
- Integración con [Stripe / pasarela de pagos / email / almacenamiento / colas].

## Tecnologías

| Área | Tecnología |
|---|---|
| Lenguaje | [TypeScript / JavaScript / Python / PHP] |
| Runtime | [Node.js 18+ / Python 3.11+ / PHP 8.2+] |
| Framework | [Express / NestJS / Fastify / Django / Laravel] |
| Base de datos | [PostgreSQL / MySQL / MongoDB] |
| ORM / ODM | [Prisma / TypeORM / Sequelize / Mongoose / SQLAlchemy] |
| Autenticación | [JWT / Passport / Auth0] |
| Validación | [Zod / Joi / class-validator] |
| Testing | [Jest / Vitest / Supertest / Playwright] |
| Documentación | [Swagger / OpenAPI] |
| Contenedores | [Docker / Docker Compose] |
| CI/CD | [GitHub Actions] |

## Arquitectura

El proyecto sigue una arquitectura [en capas / hexagonal / modular], separando la lógica de negocio, el acceso a datos y la capa HTTP.

```text
Cliente / Frontend
        |
        v
   API Backend
        |
        +--> Controladores / Rutas
        +--> Servicios / Casos de uso
        +--> Repositorios / Modelos
        +--> Base de datos
        +--> Servicios externos
```

### Capas principales

- **Rutas / Controladores:** reciben peticiones HTTP, validan entradas y devuelven respuestas.
- **Servicios:** contienen la lógica de negocio.
- **Repositorios / Modelos:** acceden a la base de datos.
- **Middlewares:** gestionan autenticación, errores, logging, CORS y rate limiting.
- **Esquemas / DTOs:** definen y validan los datos que entran y salen de la API.

## Requisitos previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) versión 18 o superior.
- [npm](https://www.npmjs.com/) o [pnpm](https://pnpm.io/).
- [Git](https://git-scm.com/).
- [PostgreSQL](https://www.postgresql.org/) o Docker.
- [Docker](https://www.docker.com/) y Docker Compose, opcional pero recomendado.

Verifica las versiones:

```bash
node -v
npm -v
git --version
docker --version
```

## Instalación

1. Clona el repositorio:

```bash
git clone [https://github.com/jsersan/burtsa-backend.git](https://github.com/jsersan/burtsa-backend.git)
cd burtsa-backend
```

2. Instala las dependencias:

```bash
npm install
```

Si usas pnpm:

```bash
pnpm install
```

3. Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

4. Abre `.env` y configura las variables necesarias.

5. Levanta la base de datos con Docker, si aplica:

```bash
docker compose up -d
```

6. Ejecuta migraciones y seeds:

```bash
npm run migration:run
npm run seed
```

7. Inicia el servidor en modo desarrollo:

```bash
npm run dev
```

La API estará disponible por defecto en:

```text
http://localhost:3000
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto. No subas credenciales reales al repositorio.

```env
# Aplicación
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Base de datos
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/burtsa
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario
DB_PASSWORD=contrasena
DB_NAME=burtsa

# Autenticación
JWT_SECRET=cambia-esta-clave-por-una-segura
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=cambia-esta-clave-por-una-segura
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Servicios externos
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=usuario
SMTP_PASSWORD=contrasena
STRIPE_SECRET_KEY=sk_test_xxx

# Logging
LOG_LEVEL=debug
```

> Usa valores distintos para desarrollo, staging y producción. En producción, guarda los secretos en un gestor seguro como AWS Secrets Manager, Vault, GitHub Secrets o las variables de entorno del proveedor de despliegue.

## Uso

### Iniciar en desarrollo

```bash
npm run dev
```

### Compilar para producción

```bash
npm run build
```

### Iniciar en producción

```bash
npm start
```

### Comprobar el estado del servicio

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "uptime": 12.34,
  "environment": "development"
}
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática. |
| `npm run build` | Compila el proyecto para producción. |
| `npm start` | Inicia la versión compilada del proyecto. |
| `npm test` | Ejecuta los tests. |
| `npm run test:watch` | Ejecuta los tests en modo observación. |
| `npm run lint` | Analiza el código con ESLint. |
| `npm run format` | Formatea el código con Prettier. |
| `npm run migration:run` | Aplica las migraciones pendientes. |
| `npm run migration:revert` | Revierte la última migración. |
| `npm run seed` | Inserta datos iniciales en la base de datos. |
| `docker compose up -d` | Levanta los servicios definidos en Docker Compose. |

## Documentación de la API

La documentación interactiva está disponible en:

```text
http://localhost:3000/api/docs
```

También puedes importar la colección de Postman desde:

```text
docs/postman_collection.json
```

### Convenciones de la API

- Base URL: `http://localhost:3000/api/v1`
- Formato de respuesta: JSON.
- Autenticación: `Authorization: Bearer <token>`.
- Códigos HTTP estándar: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `500`.

### Ejemplo: registro de usuario

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Str0ngP@ssword!"
  }'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Ejemplo: inicio de sesión

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "Str0ngP@ssword!"
  }'
```

### Endpoints principales

| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| `GET` | `/health` | Comprueba el estado del servicio. | No |
| `POST` | `/auth/register` | Registra un nuevo usuario. | No |
| `POST` | `/auth/login` | Inicia sesión y devuelve un token. | No |
| `POST` | `/auth/refresh` | Renueva el token de acceso. | No |
| `GET` | `/users/me` | Obtiene el perfil del usuario autenticado. | Sí |
| `PATCH` | `/users/me` | Actualiza el perfil del usuario autenticado. | Sí |
| `GET` | `/[recurso]` | Lista recursos con paginación y filtros. | Sí |
| `POST` | `/[recurso]` | Crea un recurso. | Sí |
| `GET` | `/[recurso]/:id` | Obtiene un recurso por ID. | Sí |
| `PATCH` | `/[recurso]/:id` | Actualiza un recurso. | Sí |
| `DELETE` | `/[recurso]/:id` | Elimina un recurso. | Sí |

## Base de datos

El proyecto utiliza [PostgreSQL] como base de datos principal.

### Migraciones

```bash
npm run migration:run
```

### Revertir migraciones

```bash
npm run migration:revert
```

### Datos iniciales

```bash
npm run seed
```

### Diagrama de entidades

```text
User 1---* Reservation
User 1---* Payment
Reservation 1---1 Payment
```

Sustituye este diagrama por las entidades reales de Burtsa.

## Pruebas

Ejecuta toda la suite de tests:

```bash
npm test
```

Ejecuta tests con cobertura:

```bash
npm run test:coverage
```

Ejecuta tests de integración:

```bash
npm run test:integration
```

Los tests deben ejecutarse contra una base de datos de pruebas, nunca contra producción.

## Despliegue

### Docker

```bash
docker compose up -d --build
```

### Docker Compose

Ejemplo de `docker-compose.yml`:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - db

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: usuario
      POSTGRES_PASSWORD: contrasena
      POSTGRES_DB: burtsa
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

### Plataformas compatibles

El proyecto puede desplegarse en:

- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [Fly.io](https://fly.io/)
- [AWS ECS / EC2]
- [Google Cloud Run]
- [Azure App Service]
- [Vercel], si la arquitectura es compatible con funciones serverless.

## Estructura del proyecto

```text
burtsa-backend/
├── src/
│   ├── config/           # Configuración y variables de entorno
│   ├── controllers/      # Controladores HTTP
│   ├── services/         # Lógica de negocio
│   ├── repositories/     # Acceso a datos
│   ├── models/           # Modelos o entidades
│   ├── routes/           # Definición de rutas
│   ├── middlewares/      # Auth, errores, validación, logs
│   ├── validators/       # Esquemas y DTOs
│   ├── utils/            # Utilidades
│   └── app.ts            # Configuración de la aplicación
├── tests/
│   ├── unit/
│   └── integration/
├── prisma/               # Si usas Prisma
├── migrations/           # Migraciones de base de datos
├── docs/                 # Documentación adicional
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## Convenciones

### Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: añadir endpoint de reservas
fix: corregir validación de email
docs: actualizar instrucciones de instalación
refactor: extraer lógica de pagos a un servicio
test: añadir tests de autenticación
chore: actualizar dependencias
```

### Ramas

- `main`: rama estable y desplegable.
- `develop`: integración de funcionalidades.
- `feature/nombre-funcionalidad`: nueva funcionalidad.
- `fix/nombre-bug`: corrección de errores.
- `chore/nombre-tarea`: tareas de mantenimiento.

### Estilo de código

- Usa TypeScript estricto, si aplica.
- Mantén funciones pequeñas y con una única responsabilidad.
- Valida toda entrada externa.
- No incluyas secretos en el código.
- Escribe tests para funcionalidades nuevas y correcciones de bugs.

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama desde `develop`:

```bash
git checkout -b feature/mi-funcionalidad
```

3. Realiza los cambios y añade tests.
4. Ejecuta lint y tests:

```bash
npm run lint
npm test
```

5. Haz commits siguiendo Conventional Commits.
6. Abre un Pull Request describiendo el cambio, el motivo y cómo probarlo.

## Solución de problemas

### El puerto 3000 está ocupado

Cambia el puerto en `.env`:

```env
PORT=3001
```

### No se conecta a la base de datos

- Comprueba que la base de datos esté activa.
- Revisa `DATABASE_URL` o las variables `DB_*`.
- Si usas Docker, verifica que el contenedor esté levantado:

```bash
docker ps
docker compose logs db
```

### Error de migraciones

```bash
npm run migration:revert
npm run migration:run
```

### Error de permisos en Linux o macOS

```bash
sudo chown -R $(whoami) .
```

## Roadmap

- [ ] Añadir autenticación con proveedores externos.
- [ ] Implementar recuperación de contraseña.
- [ ] Añadir paginación, filtrado y ordenación avanzada.
- [ ] Crear panel de administración.
- [ ] Añadir tests end-to-end.
- [ ] Mejorar observabilidad con métricas y tracing.
- [ ] Publicar documentación OpenAPI.

## Licencia

Distribuido bajo la licencia [MIT / Apache-2.0 / privada]. Consulta el archivo `LICENSE` para más información.

## Contacto

- **Autor:** [jsersan](https://github.com/jsersan)
- **Repositorio:** https://github.com/jsersan/burtsa-backend
- **Issues:** https://github.com/jsersan/burtsa-backend/issues
- **Email:** [tu-email@ejemplo.com]
