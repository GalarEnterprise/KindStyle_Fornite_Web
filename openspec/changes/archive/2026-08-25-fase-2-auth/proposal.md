# Fase 2 - Autenticación

## Qué

Implementar el sistema completo de autenticación: registro y login para clientes (email + código de verificación, contraseña opcional), login para admin (email/usuario + contraseña), gestión de sesiones con límite de 2 simultáneas, middleware de protección de rutas, y roles (USER, ADMIN, SUPER_ADMIN).

## Por Qué

La autenticación es necesaria para que los clientes puedan crear cuentas, gestionar sus bots, realizar solicitudes, y para que los admins puedan operar el panel. Sin auth, no hay identidad ni protección de rutas.

## Alcance

### In-scope
- Registro de clientes: email + código de verificación (6 dígitos)
- Código de verificación: expira en 10 min, 10 intentos, bloqueo 15 min, cooldown 3 min
- Login de clientes: email + código O email + contraseña opcional
- Nickname obligatorio para comprar (primer login)
- Máximo 2 sesiones activas simultáneas por usuario
- Login de admin: email/usuario + contraseña
- Roles: USER, ADMIN, SUPER_ADMIN
- Middleware de protección: `auth`, `admin`, `super-admin`
- Cookies httpOnly para JWT
- Rate limiting en endpoints de auth
- Envío de código por email (Resend)
- Hash de contraseñas con bcrypt (12 rounds)
- Seed de Super Admin inicial

### Non-goals
- No implementar OAuth social (Google, Discord)
- No implementar 2FA para admin (opcional para futuro)
- No implementar forgot password (usar re-login con código)
- No implementar panel de admin (Fase 9)
- No implementar carrito ni requests (Fase 3/4)

## Specs afectadas

- `auth` — Nuevos requerimientos de registro, login, sesiones, roles, seguridad

## Criterios de éxito

1. Registro con email + código funciona correctamente
2. Login con email + código funciona correctamente
3. Login con email + contraseña funciona (si la creó)
4. Código expira en 10 minutos
5. Bloqueo tras 10 intentos por 15 minutos
6. Cooldown de 3 minutos para reenviar código
7. Máximo 2 sesiones activas (la más antigua se cierra)
8. Middleware protege rutas `/account/*` y `/admin/*`
9. Roles funcionan correctamente (USER, ADMIN, SUPER_ADMIN)
10. Seed de Super Admin inicial funciona
11. `npm run typecheck` pasa sin errores
12. `npm run lint` pasa sin errores
13. Tests con cobertura >80%

## Estimación

- **Duración**: 4-5 horas
- **Complejidad**: Media
- **Riesgo**: Medio (seguridad, sesiones)
