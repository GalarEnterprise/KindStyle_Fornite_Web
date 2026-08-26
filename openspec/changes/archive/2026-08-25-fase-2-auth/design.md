# Fase 2 - Autenticación — Diseño Técnico

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENTE (email)                        │
│                                                          │
│  /register → /verify → /login                            │
│       │         │          │                             │
│       ▼         ▼          ▼                             │
│  POST /api/auth/register                                 │
│  POST /api/auth/verify                                   │
│  POST /api/auth/login                                    │
│  POST /api/auth/logout                                   │
│  GET  /api/auth/sessions                                 │
│  POST /api/auth/password                                 │
│                                                          │
│  Headers:                                                │
│  Cookie: accessToken=jwt; refreshToken=jwt              │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   ADMIN                                  │
│                                                          │
│  /admin/login                                            │
│       │                                                  │
│       ▼                                                  │
│  POST /api/admin/auth/login                              │
│  POST /api/admin/auth/logout                             │
│  GET  /api/admin/auth/me                                 │
│                                                          │
│  Headers:                                                │
│  Cookie: adminAccessToken=jwt; adminRefreshToken=jwt    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVICES                               │
│                                                          │
│  AuthService     → register, login, verify              │
│  TokenService    → generate, validate, refresh          │
│  SessionService  → create, validate, revoke, limit      │
│  EmailService    → send verification code (Resend)      │
└─────────────────────────────────────────────────────────┘
```

## Flujo de Registro

```
POST /api/auth/register
    ↓
1. Validar email (Zod)
2. Verificar que no existe
3. Generar código de 6 dígitos
4. Guardar en verification_codes (expires: 10 min)
5. Enviar email con Resend
6. Responder: { success: true, message: "Código enviado" }
```

```
POST /api/auth/verify
    ↓
1. Validar email + código
2. Buscar verification_code activo
3. Verificar expiración (< 10 min)
4. Verificar intentos (< 10)
5. Si código correcto:
   - Crear User (role: USER)
   - Marcar code como verificado
   - Generar tokens (access + refresh)
   - Crear sesión
   - Responder: { success: true, tokens, isFirstLogin: true }
6. Si código incorrecto:
   - Incrementar intentos
   - Si intentos >= 10: bloquear por 15 min
   - Responder: { success: false, error }
```

```
POST /api/auth/login
    ↓
1. Validar email + (código o contraseña)
2. Si código: verificar como en /verify
3. Si contraseña: verificar bcrypt hash
4. Crear sesión, generar tokens
5. Verificar límite de sesiones (máx 2)
   - Si > 2: revocar sesión más antigua
6. Setear cookies httpOnly
7. Responder: { success: true, tokens }
```

## Decisiones Técnicas

### 1. JWT + httpOnly cookies

**Acceso token**: 15 minutos
**Refresh token**: 7 días

**Decisión**: httpOnly cookies en lugar de localStorage.

**Razones**:
- Protege contra XSS
- Cookies son enviadas automáticamente
- Mejor seguridad para tokens

**Trade-offs**:
- ❌ No accesible desde JS
- ✅ Protección contra XSS
- ❌ CSRF risk (mitigado con SameSite)

### 2. Sesiones en DB

```
Session
  id: uuid
  user_id: string
  token: string (unique)
  refresh_token: string (unique)
  expires_at: DateTime
  created_at: DateTime
  user_agent: string?
  ip_address: string?
```

**Decisión**: Sesiones en PostgreSQL en lugar de Redis.

**Razones**:
- Persistencia entre reinicios
- Queries para listar sesiones activas
- Suficiente rendimiento para MVP

**Trade-offs**:
- ❌ Más lento que Redis
- ✅ Persistente
- ✅ Queryable

### 3. Códigos de verificación

```
VerificationCode
  id: uuid
  user_id: string? (null si aún no existe user)
  email: string
  code: string (6 dígitos)
  attempts: int (default 0)
  expires_at: DateTime (10 min)
  verified: bool (default false)
  created_at: DateTime
```

**Generación**: `Math.floor(100000 + Math.random() * 900000).toString()`

**Bloqueo**: Tras 10 intentos fallidos, se marca `blocked_until` con 15 minutos.

### 4. Contraseña opcional

El cliente PUEDE crear una contraseña después del registro, pero NO es obligatoria.

```
User
  id: uuid
  email: string (unique)
  nickname: string? (unique, required for purchases)
  password_hash: string? (nullable)
  role: UserRole (USER)
  verification_status: VerificationStatus
  ...
```

**Al crear contraseña**: Se aclara que NO debe ser su contraseña real de Epic/Fortnite.

### 5. Límite de sesiones

```typescript
async function enforceSessionLimit(userId: string) {
  const sessions = await db.session.findMany({
    where: { user_id: userId, expires_at: { gt: now() } },
    orderBy: { created_at: 'asc' },
  })

  if (sessions.length >= 2) {
    // Revocar la más antigua
    await db.session.delete({ where: { id: sessions[0].id } })
  }
}
```

### 6. Middleware de protección

```typescript
// apps/web/src/lib/auth/middleware.ts

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  if (!token) return NextResponse.redirect('/login')

  try {
    const payload = await verifyToken(token)
    return payload
  } catch {
    // Intentar refresh
    const refresh = request.cookies.get('refreshToken')?.value
    if (!refresh) return NextResponse.redirect('/login')

    const newTokens = await refreshAccessToken(refresh)
    // Set new cookies, return payload
  }
}

export async function requireAdmin(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect('/')
  }
  return payload
}
```

### 7. Rate limiting

**Endpoints de auth**: 10 requests/minuto por IP
**Endpoints generales**: 100 requests/minuto por IP

**Implementación**: Redis con claves `rate:auth:<ip>` y `rate:api:<ip>`.

### 8. Email con Resend

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendVerificationCode(email: string, code: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Tu código de verificación - KindStyle',
    html: `
      <h1>Código de verificación</h1>
      <p>Tu código es: <strong>${code}</strong></p>
      <p>Este código expira en 10 minutos.</p>
    `,
  })
}
```

## Estructura de Archivos

```
apps/web/src/
├── lib/
│   ├── services/
│   │   └── auth/
│   │       ├── auth-service.ts          → register, login, verify
│   │       ├── token-service.ts         → JWT generation/validation
│   │       ├── session-service.ts       → session management
│   │       └── email-service.ts         → Resend integration
│   ├── auth/
│   │   ├── middleware.ts                → route protection
│   │   └── cookies.ts                   → cookie helpers
│   ├── validators/
│   │   └── auth.ts                      → Zod schemas
│   └── db/
│       └── client.ts                    → Prisma singleton
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                 → Login page
│   │   ├── register/
│   │   │   └── page.tsx                 → Register page
│   │   ├── verify/
│   │   │   └── page.tsx                 → Verify code page
│   │   └── layout.tsx                   → Auth layout
│   ├── account/                         → Protected (requireAuth)
│   └── admin/                           → Protected (requireAdmin)
│
├── components/
│   └── auth/
│       ├── login-form.tsx
│       ├── register-form.tsx
│       ├── verify-code-form.tsx
│       └── nickname-form.tsx
│
└── hooks/
    └── use-auth.ts                      → Auth context

packages/database/prisma/
└── seed.ts                              → Add Super Admin seed
```

## Trade-offs

| Decisión | Pro | Contra |
|----------|-----|--------|
| JWT + cookies | Seguro contra XSS | CSRF risk (mitigado) |
| Sesiones en DB | Persistente, queryable | Más lento que Redis |
| Contraseña opcional | Más fácil para usuarios | Menos seguridad si no la usan |
| Email como único identificador | Simple | No soporta multi-email |

## Alternativas Consideradas

1. **OAuth social**: Descartada para MVP — complejidad innecesaria
2. **Magic links**: Descartado — requiere click en email (más fricción que código)
3. **Sessions en Redis**: Postpuesto — PostgreSQL es suficiente para MVP
