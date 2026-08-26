# Fase 0 - Diseño Técnico

## Arquitectura

```
kindstyle_tienda_fornite/
├── apps/web/                    # Next.js 14 (App Router)
├── packages/
│   ├── database/                # Prisma + migrations
│   └── shared/                  # Tipos + utils compartidas
├── workers/                     # BullMQ workers
└── docker-compose.yml           # PostgreSQL + Redis
```

## Decisiones Técnicas

### 1. Monorepo con npm workspaces
**Decisión**: Usar npm workspaces en lugar de Turborepo o Nx.

**Razones**:
- Simplicidad: npm workspaces es nativo de Node.js
- No requiere herramientas adicionales
- Suficiente para el tamaño del proyecto
- Fácil migración a Turborepo si es necesario después

**Trade-offs**:
- ✅ Simple, sin dependencias extra
- ❌ Menos features que Turborepo (caching, parallel builds)
- ✅ Suficiente para MVP

### 2. Next.js App Router
**Decisión**: Usar App Router (no Pages Router).

**Razones**:
- Mejor DX con React Server Components
- Mejor performance (streaming, partial prerendering)
- Futuro de Next.js
- Layouts anidados para account/admin panels

### 3. Prisma ORM
**Decisión**: Prisma en lugar de Drizzle o Knex.

**Razones**:
- Type-safe queries
- Migrations automáticas
- Excelente DX
- Comunidad grande
- Studio incluido

**Trade-offs**:
- ❌ Menos control que SQL directo
- ✅ Productividad alta
- ✅ Type-safety

### 4. Redis para múltiples propósitos
**Decisión**: Usar Redis para cache, queues, locks.

**Razones**:
- BullMQ para background jobs
- Cache de catálogo (shop snapshots)
- Rate limiting
- Futuro: bot reservations

**Alternativa considerada**: Usar PostgreSQL para queues
- ✅ PostgreSQL ya existe
- ❌ Menos performante para queues
- ❌ Más complejo de implementar

### 5. TypeScript strict mode
**Decisión**: `strict: true` en tsconfig.

**Razones**:
- Catch errores en tiempo de compilación
- Mejor DX con autocomplete
- Documentación implícita de tipos
- Previene bugs comunes

### 6. UUIDs para IDs
**Decisión**: UUIDs v4 en lugar de autoincrement.

**Razones**:
- No revelan información (seguridad)
- Permiten sincronización distribuida
- No hay colisiones en merge de datos
- Compatible con futuras sharding

**Trade-offs**:
- ❌ Más espacio que INT
- ❌ Menos legible en URLs
- ✅ Mejor para seguridad

## Estructura de Base de Datos

### Tablas principales

1. **Users & Auth**
   - `users` - Usuarios del sistema
   - `sessions` - Sesiones activas
   - `verification_codes` - Códigos de verificación email

2. **Fortnite Accounts**
   - `fortnite_accounts` - Cuentas vinculadas del usuario

3. **Catalog**
   - `products` - Productos de Fortnite
   - `shop_snapshots` - Snapshots de la tienda
   - `shop_items` - Items en snapshot específico

4. **Cart**
   - `cart_items` - Items en carrito del usuario

5. **Requests**
   - `requests` - Solicitudes de productos
   - `request_items` - Items en solicitud

6. **Payments**
   - `payments` - Pagos y validaciones

7. **Bots & Friendship**
   - `fulfillment_accounts` - Bots del sistema
   - `friendship_requests` - Solicitudes de amistad
   - `friendship_request_bots` - Bots asignados a solicitud

8. **Notifications**
   - `notifications` - Notificaciones enviadas
   - `notification_preferences` - Preferencias del usuario

9. **Currency**
   - `exchange_rates` - Tasas de cambio
   - `currency_settings` - Configuración de monedas

10. **Audit**
    - `event_logs` - Eventos del sistema
    - `audit_logs` - Acciones de admin

### Relaciones clave

```
User 1:N FortniteAccount
User 1:N Request
User 1:N FriendshipRequest
User 1:N CartItem
User 1:N Notification

Request 1:N RequestItem
Request 1:N Payment

FriendshipRequest 1:N FriendshipRequestBot
FriendshipRequestBot N:1 FulfillmentAccount
```

## Variables de Entorno

```bash
# Database
DATABASE_URL=postgresql://kindstyle:kindstyle_dev@localhost:5432/kindstyle_dev

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@kindstyle.com

# Fortnite API
FORTNITE_API_KEY=...
FORTNITE_API_URL=https://fortnite-api.com

# Encryption
ENCRYPTION_KEY=<random-32-chars>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=+523191033181

# Mock mode
MOCK_FORTNITE=false
MOCK_FULFILLMENT=false

# Payment info
PAYMENT_CLABE=722969040853088360
PAYMENT_OXXO_ACCOUNT=4217470331487708
PAYMENT_BENEFICIARY=Lidia Isela Perez R.
```

## Scripts npm

```bash
# Desarrollo
npm run dev                    # Next.js dev server
npm run dev:worker             # Worker dev server

# Database
npm run db:generate            # Generar Prisma client
npm run db:migrate             # Correr migraciones
npm run db:push                # Push schema (dev only)
npm run db:seed                # Seed database
npm run db:studio              # Prisma Studio

# Build
npm run build                  # Build all packages
npm run build:web              # Build web app only

# Test
npm run test                   # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report

# Lint
npm run lint                   # ESLint
npm run lint:fix               # Fix ESLint issues
npm run format                 # Prettier format
npm run typecheck              # TypeScript check
```

## Seguridad

### Contraseñas
- Bcrypt con 12 rounds
- Nunca loguear passwords

### JWT
- Access token: 15 minutos
- Refresh token: 7 días
- httpOnly cookies
- Secure flag en producción

### Encryption
- AES-256-GCM para credenciales de Epic
- Clave en env var (no en código)
- Solo admin puede ver post-validación

### Rate limiting
- Auth endpoints: 10 requests/minute
- API general: 100 requests/minute
- Redis para tracking

## Convenciones de Código

### TypeScript
- `strict: true`
- No `any`
- Interfaces para objetos
- Enums para valores fijos

### Naming
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- DB tables: `snake_case`
- API routes: `kebab-case`

### Imports
```typescript
// 1. Node built-ins
import { join } from 'path'

// 2. External packages
import { z } from 'zod'

// 3. Internal packages
import { type Request } from '@kindstyle/shared'

// 4. Relative (absolute from src/)
import { db } from '@/lib/db'
```

## Testing

### Stack
- Vitest como test runner
- Testing utilities de Next.js
- Mock de Prisma

### Estrategia
- Unit tests para services
- Integration tests para API routes
- E2E tests (futuro)

### Coverage
- Mínimo 80%
- 100% en critical paths (payments, auth)

## Próximos Pasos

1. ✅ Crear estructura de carpetas
2. ✅ Configurar package.json root
3. ✅ Configurar TypeScript
4. ✅ Crear Docker Compose
5. ✅ Crear .env.example
6. ✅ Crear schema Prisma
7. ⏭️ Ejecutar `npm install`
8. ⏭️ Levantar Docker
9. ⏭️ Correr migraciones
10. ⏭️ Verificar que todo funcione
