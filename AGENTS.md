# AGENTS.md - KindStyle Fortnite Store

## Project Overview

Tienda online de Fortnite con sistema de gifting manual. Monorepo con Next.js, TypeScript, PostgreSQL, Redis.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Base de datos**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache/Queue**: Redis + BullMQ
- **Email**: Resend
- **Estilos**: Tailwind CSS
- **Validación**: Zod
- **Auth**: JWT + bcrypt
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Containerización**: Docker + Docker Compose

## Project Structure

```
kindstyle_tienda_fornite/
├── apps/web/                    # Next.js app
├── packages/database/           # Prisma schema + migrations
├── packages/shared/             # Tipos y utilidades compartidas
├── workers/                     # Background jobs
├── scripts/                     # Scripts de utilidad
└── docs/requirements/           # Documentación
```

## Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Next.js dev server
npm run dev:worker             # Worker dev server

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Run migrations
npm run db:push                # Push schema changes (dev only)
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

## Code Conventions

### TypeScript
- Strict mode enabled
- No `any` types
- Use interfaces for object shapes
- Use enums for fixed sets of values
- Export types from `types/` directories

### Naming
- Files: kebab-case (`friendship-request.ts`)
- Components: PascalCase (`FriendshipRequest.tsx`)
- Functions: camelCase (`getFriendshipRequest`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- Database tables: snake_case (`friendship_requests`)
- API routes: kebab-case (`/api/friendship-requests`)

### Imports
```typescript
// 1. Node built-ins
import { join } from 'path'

// 2. External packages
import { z } from 'zod'

// 3. Internal packages (@kindstyle/*)
import { type Request } from '@kindstyle/shared'

// 4. Relative imports (absolute from src/)
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
```

### Error Handling
- Always use try/catch with typed errors
- Use custom error classes
- Log errors with context
- Return user-friendly messages

### Database
- All tables have `id`, `created_at`, `updated_at`
- Use UUIDs for IDs
- Soft delete where appropriate
- Index foreign keys
- Use transactions for multi-step operations

### API Routes
- RESTful conventions
- Validate all inputs with Zod
- Return consistent response format
- Handle errors gracefully

```typescript
// Response format
{
  success: boolean
  data?: T
  error?: { code: string; message: string }
}
```

### Authentication
- JWT tokens in httpOnly cookies
- Refresh token rotation
- Max 2 concurrent sessions per user
- Rate limit auth endpoints

### Security
- Never store Epic/Fortnite passwords in plain text
- Encrypt sensitive data at rest
- Use environment variables for secrets
- Validate all user inputs
- Sanitize outputs

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Email (Resend)
RESEND_API_KEY=...
EMAIL_FROM=noreply@kindstyle.com

# Fortnite API
FORTNITE_API_KEY=...
FORTNITE_API_URL=...

# Encryption
ENCRYPTION_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=+523531022207

# Mock mode
MOCK_FORTNITE=false
MOCK_FULFILLMENT=false
```

## Key Business Rules

### Monedas
- Base: MXN
- Admin configura moneda default
- Usuario puede cambiar en header
- Conversión dinámica vs MXN
- Soporte: USD, MXN, COP, ARS, PEN, EUR

### V-Bucks Pricing
- 100 V-Bucks = 7.5 MXN (default, configurable)
- Productos V-Bucks/Crew tienen precio asignado por admin

### Timers
- Fuente de verdad: PostgreSQL
- Cada bot tiene timer independiente
- Agregar bot NO resetea timers existentes
- Frontend solo muestra, backend decide elegibilidad

### Friendship Period
- Configurable (default: 48h)
- NO hardcodear en código
- Se calcula: friendship_confirmed_at + period = eligibility_at

### Payments
- Manual: transferencia + OXXO
- Sin pasarela de pago
- Admin valida comprobantes
- Credenciales solo visibles después de validar pago

### Admin Roles
- Super Admin: gestión completa + otros admins
- Admin: operaciones + métricas

## Testing Requirements

- Unit tests para servicios
- Integration tests para APIs
- Test edge cases y error paths
- Mock external services
- Coverage mínimo: 80%

## Git Conventions

```
feat: agregar sistema de timers individuales
fix: corregir cálculo de elegibilidad
docs: actualizar AGENTS.md
refactor: extraer lógica de asignación de bots
test: agregar tests para friendship service
chore: actualizar dependencias
```

## Deployment

- Frontend: Vercel
- Backend/Worker: Railway
- Database: Railway PostgreSQL
- Redis: Railway Redis

## Documentation

- Ver `docs/requirements/` para specs detalladas
- Ver `SPEC.md` para especificación completa
- Comentar código solo cuando sea necesario
- JSDoc para funciones públicas complejas

## Phase Implementation Order

1. **FASE 0**: Foundation (monorepo, DB, Docker)
2. **FASE 1**: Catálogo (API, Snapshots, colecciones)
3. **FASE 2**: Auth (email + código, sesiones)
4. **FASE 3**: Carrito (add/remove, productos especiales)
5. **FASE 4**: Requests (ID, WhatsApp, Copy)
6. **FASE 5**: Bots (Friendship, Admin Panel)
7. **FASE 6**: Timers (cronómetros individuales)
8. **FASE 7**: Pagos (transferencia, OXXO, comprobantes)
9. **FASE 8**: Notifications (Web, Email, WhatsApp)
10. **FASE 9**: Admin (Dashboard, métricas, audit)
11. **FASE 10**: Monedas (conversión, selector)

## Important Notes

- NO implementar pagos online en MVP
- NO implementar fulfillment automático en MVP
- NO implementar verificación automática de destinatario
- SI implementar interfaces para futuras extensiones
- Usar mocks cuando integración no esté disponible
- Completar una fase antes de empezar la siguiente
