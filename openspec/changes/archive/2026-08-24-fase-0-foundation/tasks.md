# Fase 0 - Tareas de Implementación

## Tarea 1: Verificar estructura de archivos

**Objetivo**: Confirmar que todos los archivos base están creados correctamente.

**Criterios de aceptación**:
- [x] `package.json` existe en raíz
- [x] `tsconfig.json` existe en raíz
- [x] `docker-compose.yml` existe en raíz
- [x] `.env.example` existe en raíz
- [x] `packages/database/prisma/schema.prisma` existe
- [x] `packages/database/package.json` existe
- [x] `packages/shared/package.json` existe
- [x] `apps/web/package.json` existe
- [x] `workers/package.json` existe

**Estimación**: 5 minutos

---

## Tarea 2: Instalar dependencias

**Objetivo**: Instalar todas las dependencias del monorepo.

**Comandos**:
```bash
npm install
```

**Criterios de aceptación**:
- [x] `node_modules/` existe en raíz
- [x] `node_modules/` existe en cada workspace
- [x] No hay errores de instalación
- [x] Todas las dependencias listadas en package-lock.json

**Estimación**: 2-3 minutos

---

## Tarea 3: Levantar servicios Docker

**Objetivo**: Iniciar PostgreSQL y Redis localmente.

**Comandos**:
```bash
docker-compose up -d
docker-compose ps
```

**Criterios de aceptación**:
- [x] Container `kindstyle-postgres` está running
- [x] Container `kindstyle-redis` está running
- [x] Puerto 5433 está accesible (5432 ocupado)
- [x] Puerto 6379 está accesible
- [x] Healthcheck de PostgreSQL pasa
- [x] Healthcheck de Redis pasa

**Verificación**:
```bash
docker-compose exec postgres psql -U kindstyle -c "SELECT 1"
docker-compose exec redis redis-cli ping
```

**Estimación**: 2-3 minutos

---

## Tarea 4: Configurar variables de entorno

**Objetivo**: Crear archivo .env local con valores de desarrollo.

**Comandos**:
```bash
cp .env.example .env
```

**Acciones**:
- [x] Copiar .env.example a .env
- [x] Generar JWT_SECRET (64 chars random)
- [x] Generar JWT_REFRESH_SECRET (64 chars random)
- [x] Generar ENCRYPTION_KEY (32 chars random)
- [x] Configurar DATABASE_URL con credenciales locales (puerto 5433)
- [x] Configurar REDIS_URL con credenciales locales
- [x] Dejar valores mock para RESEND_API_KEY, FORTNITE_API_KEY

**Generación de secrets**:
```bash
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 48  # JWT_REFRESH_SECRET
openssl rand -base64 24  # ENCRYPTION_KEY
```

**Estimación**: 5 minutos

---

## Tarea 5: Generar cliente Prisma

**Objetivo**: Generar el cliente TypeScript de Prisma.

**Comandos**:
```bash
npm run db:generate
```

**Criterios de aceptación**:
- [x] Cliente Prisma generado en `packages/database/node_modules/.prisma/client`
- [x] Tipos TypeScript generados correctamente
- [x] No hay errores de generación

**Estimación**: 30 segundos

---

## Tarea 6: Ejecutar migraciones

**Objetivo**: Crear tablas en base de datos PostgreSQL.

**Comandos**:
```bash
npm run db:migrate
```

**Acciones**:
- [x] Ejecutar migración inicial
- [x] Nombrar migración: `init`
- [x] Verificar que todas las tablas se crearon

**Verificación**:
```bash
docker-compose exec postgres psql -U kindstyle -d kindstyle_dev -c "\dt"
```

**Tablas esperadas**:
- users
- sessions
- verification_codes
- fortnite_accounts
- products
- shop_snapshots
- shop_items
- cart_items
- requests
- request_items
- payments
- fulfillment_accounts
- friendship_requests
- friendship_request_bots
- notifications
- notification_preferences
- exchange_rates
- currency_settings
- event_logs
- audit_logs

**Estimación**: 1-2 minutos

---

## Tarea 7: Verificar TypeScript

**Objetivo**: Confirmar que no hay errores de TypeScript.

**Comandos**:
```bash
npm run typecheck
```

**Criterios de aceptación**:
- [x] No hay errores de compilación
- [x] Todos los archivos .ts compilan correctamente
- [x] Path aliases funcionan (@/, @kindstyle/*)

**Estimación**: 30 segundos

---

## Tarea 8: Verificar ESLint

**Objetivo**: Confirmar que no hay errores de linting.

**Comandos**:
```bash
npm run lint
```

**Criterios de aceptación**:
- [x] No hay errores de ESLint
- [x] Configuración de ESLint funciona en todos los workspaces

**Nota**: Si hay warnings, están OK. Solo errores bloquean.

**Estimación**: 1-2 minutos

---

## Tarea 9: Iniciar servidor de desarrollo

**Objetivo**: Verificar que Next.js inicia correctamente.

**Comandos**:
```bash
npm run dev
```

**Criterios de aceptación**:
- [x] Servidor Next.js inicia en http://localhost:3000
- [x] No hay errores en consola
- [x] Página default carga (aunque sea 404)
- [x] Hot reload funciona

**Acción**:
- [x] Abrir navegador en http://localhost:3000
- [x] Verificar que Next.js responde

**Estimación**: 1 minuto

---

## Tarea 10: Iniciar workers (opcional)

**Objetivo**: Verificar que los workers inician correctamente.

**Comandos**:
```bash
npm run dev:worker
```

**Criterios de aceptación**:
- [x] Workers inician sin errores
- [x] Se conectan a Redis
- [x] Logs muestran "All workers running"

**Estimación**: 1 minuto

---

## Tarea 11: Seed database (opcional)

**Objetivo**: Crear datos de prueba en base de datos.

**Acciones**:
- [ ] Crear usuario admin inicial
- [ ] Crear algunos productos de ejemplo
- [ ] Crear bots de ejemplo

**Nota**: Esta tarea puede hacerse después. No bloquea la Fase 0.

**Estimación**: 15-20 minutos

---

## Resumen

**Tareas críticas**: 1-10
**Tareas opcionales**: 11

**Tiempo total estimado**: 15-20 minutos (sin tarea 11)

**Definition of Done**:
- ✅ Todos los servicios están corriendo
- ✅ Base de datos está migrada
- ✅ TypeScript compila sin errores
- ✅ ESLint pasa sin errores
- ✅ Servidor Next.js inicia
- ✅ Workers inician

---

## Notas

- Si hay errores de Docker, verificar que Docker Desktop está corriendo
- Si hay errores de Prisma, verificar que DATABASE_URL está correcto
- Si hay errores de TypeScript, verificar que `npm install` completó
- Si hay errores de ESLint, puede ser necesario configurar `.eslintrc.json`
