# Fase 2 - Autenticación — Tareas de Implementación

## Tarea 1: Validators y tipos de Auth

**Objetivo**: Crear schemas de Zod y tipos para autenticación.

**Archivos a crear**:
- `apps/web/src/lib/validators/auth.ts`

**Criterios de aceptación**:
- [x] Schema `RegisterSchema` (email válido)
- [x] Schema `VerifyCodeSchema` (email + código 6 dígitos)
- [x] Schema `LoginSchema` (email + código O email + contraseña)
- [x] Schema `CreatePasswordSchema` (contraseña 8+ chars, no igual al email)
- [x] Schema `NicknameSchema` (3-20 chars, alfanumérico)
- [x] Tipos inferidos exportados
- [x] Test: validación de datos válidos e inválidos

**Estimación**: 1 hora

---

## Tarea 2: Servicio de Email

**Objetivo**: Integración con Resend para enviar códigos de verificación.

**Archivos a crear**:
- `apps/web/src/lib/services/auth/email-service.ts`

**Criterios de aceptación**:
- [x] Función `sendVerificationCode(email, code)` → envía email con Resend
- [x] Template HTML con código destacado
- [x] Manejo de errores de Resend con logging
- [x] Mock mode: si `MOCK_EMAIL=true`, loguear código en consola
- [x] Test: mock mode funciona

**Estimación**: 1 hora

---

## Tarea 3: Servicio de Tokens (JWT)

**Objetivo**: Generación y validación de tokens JWT.

**Archivos a crear**:
- `apps/web/src/lib/services/auth/token-service.ts`

**Criterios de aceptación**:
- [x] Función `generateAccessToken(userId, role)` → JWT con 15 min exp
- [x] Función `generateRefreshToken(userId)` → JWT con 7 días exp
- [x] Función `verifyToken(token)` → payload o error
- [x] Función `refreshAccessToken(refreshToken)` → nuevo access token
- [x] Tokens firmados con JWT_SECRET
- [x] Manejo de tokens expirados, inválidos, revocados
- [x] Test: generar y verificar tokens

**Estimación**: 1.5 horas

---

## Tarea 4: Servicio de Sesiones

**Objetivo**: Gestión de sesiones con límite de 2 simultáneas.

**Archivos a crear**:
- `apps/web/src/lib/services/auth/session-service.ts`

**Criterios de aceptación**:
- [x] Función `createSession(userId, token, refreshToken, userAgent, ip)`
- [x] Función `validateSession(token)` → session o null
- [x] Función `revokeSession(token)` → eliminar sesión
- [x] Función `getUserSessions(userId)` → listar sesiones activas
- [x] Función `enforceSessionLimit(userId)` → revocar más antigua si > 2
- [x] Función `revokeAllUserSessions(userId)` → cerrar todas las sesiones
- [x] Test: crear, validar, revocar, límite de sesiones

**Estimación**: 1.5 horas

---

## Tarea 5: Servicio de Auth

**Objetivo**: Registro, verificación, login.

**Archivos a crear**:
- `apps/web/src/lib/services/auth/auth-service.ts`

**Criterios de aceptación**:
- [x] Función `register(email)` → crea código, envía email
- [x] Función `verify(email, code)` → crea user si código válido
- [x] Función `loginWithCode(email, code)` → login con código
- [x] Función `loginWithPassword(email, password)` → login con contraseña
- [x] Función `createPassword(userId, password)` → setear contraseña
- [x] Función `setNickname(userId, nickname)` → setear apodo
- [x] Rate limiting: 10 intentos, bloqueo 15 min
- [x] Cooldown: 3 min para reenviar código
- [x] Test: flujo completo registro → verify → login

**Estimación**: 2 horas

---

## Tarea 6: Helpers de Cookies

**Objetivo**: Funciones para manejar cookies httpOnly.

**Archivos a crear**:
- `apps/web/src/lib/auth/cookies.ts`

**Criterios de aceptación**:
- [x] Función `setAuthCookies(response, tokens, options)`
- [x] Función `clearAuthCookies(response)`
- [x] Cookies: `accessToken`, `refreshToken` (httpOnly, secure, sameSite)
- [x] Función `getAuthCookies(request)` → leer cookies
- [x] Configuración de producción vs desarrollo

**Estimación**: 30 minutos

---

## Tarea 7: Middleware de Protección

**Objetivo**: Middleware para proteger rutas.

**Archivos a crear**:
- `apps/web/src/lib/auth/middleware.ts`

**Criterios de aceptación**:
- [x] Función `requireAuth(request)` → validar token, refresh si expirado
- [x] Función `requireAdmin(request)` → verificar rol ADMIN o SUPER_ADMIN
- [x] Función `requireSuperAdmin(request)` → verificar rol SUPER_ADMIN
- [x] Redirigir a `/login` si no autenticado
- [x] Redirigir a `/` si no tiene permisos
- [x] Test: middleware protege rutas correctamente

**Estimación**: 1 hora

---

## Tarea 8: API Routes de Auth (cliente)

**Objetivo**: Endpoints de autenticación para clientes.

**Archivos a crear**:
- `apps/web/src/app/api/auth/register/route.ts`
- `apps/web/src/app/api/auth/verify/route.ts`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/app/api/auth/logout/route.ts`
- `apps/web/src/app/api/auth/me/route.ts`
- `apps/web/src/app/api/auth/password/route.ts`
- `apps/web/src/app/api/auth/sessions/route.ts`

**Criterios de aceptación**:
- [x] `POST /api/auth/register` → envía código de verificación
- [x] `POST /api/auth/verify` → verifica código, crea user
- [x] `POST /api/auth/login` → login con código o contraseña
- [x] `POST /api/auth/logout` → revoca sesión
- [x] `GET /api/auth/me` → devuelve info del usuario
- [x] `POST /api/auth/password` → crea/cambia contraseña
- [x] `GET /api/auth/sessions` → lista sesiones activas
- [x] Validación con Zod en todos los inputs
- [x] Respuestas consistentes `{ success, data, error }`
- [x] Manejo de errores (401, 403, 429)

**Estimación**: 3 horas

---

## Tarea 9: Páginas de Auth (UI)

**Objetivo**: Páginas de registro, login, verificación.

**Archivos a crear**:
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(auth)/verify/page.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/components/auth/register-form.tsx`
- `apps/web/src/components/auth/verify-code-form.tsx`
- `apps/web/src/components/auth/login-form.tsx`
- `apps/web/src/components/auth/nickname-form.tsx`

**Criterios de aceptación**:
- [x] Página de registro: input email + botón enviar
- [x] Página de verify: input código 6 dígitos + reenviar
- [x] Página de login: email + (código O contraseña)
- [x] Formulario de nickname (primer login)
- [x] Redirección después de login exitoso
- [x] Mensajes de error claros
- [x] Loading states
- [x] Responsive

**Estimación**: 2 horas

---

## Tarea 10: Hook useAuth

**Objetivo**: Hook para acceder al estado de autenticación.

**Archivos a crear**:
- `apps/web/src/hooks/use-auth.ts`

**Criterios de aceptación**:
- [x] Hook `useAuth()` → `{ user, isLoading, isAuthenticated }`
- [x] Hook `useAdmin()` → `{ isAdmin, isSuperAdmin }`
- [x] Función `logout()` → cierra sesión
- [x] Provider que envuelve la app
- [x] Test: hook devuelve estado correcto

**Estimación**: 1 hora

---

## Tarea 11: Admin Auth

**Objetivo**: Login de admin con email/usuario + contraseña.

**Archivos a crear**:
- `apps/web/src/app/api/admin/auth/login/route.ts`
- `apps/web/src/app/api/admin/auth/logout/route.ts`
- `apps/web/src/app/api/admin/auth/me/route.ts`
- `apps/web/src/lib/services/auth/admin-auth-service.ts`
- `apps/web/src/app/(auth)/admin/login/page.tsx`

**Criterios de aceptación**:
- [x] `POST /api/admin/auth/login` → login con email/usuario + contraseña
- [x] `POST /api/admin/auth/logout` → cierra sesión
- [x] `GET /api/admin/auth/me` → info del admin
- [x] Página de login de admin separada
- [x] Cookies separadas para admin (prefijo `admin`)
- [x] Verificación de rol ADMIN o SUPER_ADMIN
- [x] Test: login admin funciona

**Estimación**: 1.5 horas

---

## Tarea 12: Seed de Super Admin

**Objetivo**: Crear Super Admin inicial en seed.

**Archivos a modificar**:
- `packages/database/prisma/seed.ts`

**Criterios de aceptación**:
- [x] Seed crea usuario con rol SUPER_ADMIN
- [x] Email configurable (default: `admin@kindstyle.com`)
- [x] Contraseña hasheada con bcrypt
- [x] Seed es idempotente (no duplica si ya existe)
- [x] `npm run db:seed` funciona correctamente

**Estimación**: 30 minutos

---

## Tarea 13: Tests de integración

**Objetivo**: Tests para el flujo completo de auth.

**Archivos a crear**:
- `apps/web/src/__tests__/auth/auth-flow.test.ts`
- `apps/web/src/__tests__/auth/api-routes.test.ts`

**Criterios de aceptación**:
- [x] Test: registro → verify → login funciona
- [x] Test: código expira en 10 min
- [x] Test: bloqueo tras 10 intentos
- [x] Test: cooldown de 3 min para reenviar
- [x] Test: límite de 2 sesiones
- [x] Test: middleware protege rutas
- [x] Test: admin login funciona
- [x] Coverage >80% en servicios de auth

**Estimación**: 2 horas

---

## Resumen

| # | Tarea | Estimación | Dependencias |
|---|-------|-----------|--------------|
| 1 | Validators y tipos | 1h | — |
| 2 | Email Service | 1h | — |
| 3 | Token Service | 1.5h | — |
| 4 | Session Service | 1.5h | 3 |
| 5 | Auth Service | 2h | 1, 2, 3, 4 |
| 6 | Cookie Helpers | 0.5h | — |
| 7 | Middleware | 1h | 3, 4 |
| 8 | API Routes Auth | 3h | 1, 5, 6 |
| 9 | Páginas de Auth UI | 2h | 8 |
| 10 | Hook useAuth | 1h | 8 |
| 11 | Admin Auth | 1.5h | 5, 7 |
| 12 | Seed Super Admin | 0.5h | — |
| 13 | Tests de integración | 2h | 8, 11 |

**Tiempo total estimado**: ~18 horas

**Orden recomendado**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 12 → 8 → 11 → 10 → 9 → 13
