# Sistema de Autenticación

## Cliente

### Registro
- Solo email (sin contraseña obligatoria)
- Envío de código de verificación (6 dígitos)
- Código expira en **10 minutos**
- Máximo **10 intentos** antes de bloqueo
- Bloqueo de **15 minutos** tras agotar intentos
- Cooldown de **3 minutos** para reenviar código
- En primer login: elegir **apodo de usuario** (público, cambiable)
- Apodo obligatorio para comprar (no para navegar)

### Login
- Email + código de verificación (mismo flujo)
- O email + contraseña (si la crearon)
- Contraseña opcional: aclarar que NO debe ser su contraseña real
- Máximo **2 sesiones activas simultáneamente**
- Puede iniciar sesión en múltiples dispositivos (solo 2 activos a la vez)

### Sesiones
- Token JWT con expiración
- Al llegar a 2 sesiones, la más antigua se cierra
- El usuario puede ver sus sesiones activas y cerrarlas

## Admin

### Roles
- **Super Admin**: 
  - Gestión completa del sistema
  - Crear/eliminar otros admins
  - Quitar acceso a admins
  - Configuración global (monedas, precios, bots)
  
- **Admin**:
  - Operar pedidos (cambiar estados)
  - Gestionar amistades (confirmar, enviar solicitudes)
  - Ver métricas
  - No puede gestionar otros admins

### Login Admin
- Email/usuario + contraseña
- Contraseña obligatoria (diferente del email)
- 2FA opcional para Super Admin

## Seguridad
- Rate limiting en endpoints de auth
- Hash de contraseñas con bcrypt
- Tokens seguros (httpOnly cookies)
- Validación con Zod en todos los inputs
- No almacenar contraseñas de clientes de Epic/Fortnite en texto plano

## Requerimientos

### REQ-AUTH-001: Registro por email

El sistema DEBE permitir el registro de clientes usando únicamente su email.

- DEBE generar un código de verificación de 6 dígitos
- DEBE enviar el código por email usando Resend
- NO DEBE requerir contraseña en el registro
- DEBE validar que el email no esté ya registrado
- DEBE responder con éxito indicando que el código fue enviado

### REQ-AUTH-002: Verificación de código

El sistema DEBE verificar el código de verificación antes de crear la cuenta.

- El código DEBE expirar en 10 minutos
- El sistema DEBE permitir máximo 10 intentos
- Tras 10 intentos fallidos, DEBE bloquear por 15 minutos
- DEBE haber un cooldown de 3 minutos para reenviar el código
- Si el código es válido, DEBE crear el usuario con rol USER
- DEBE marcar el código como verificado

### REQ-AUTH-003: Login con código

El sistema DEBE permitir login usando email + código de verificación.

- DEBE funcionar igual que la verificación pero para usuarios existentes
- DEBE generar tokens (access + refresh) tras verificación exitosa
- DEBE crear una nueva sesión en la base de datos

### REQ-AUTH-004: Login con contraseña

El sistema DEBE permitir login usando email + contraseña (si el usuario la creó).

- DEBE verificar la contraseña contra el hash almacenado (bcrypt)
- DEBE generar tokens (access + refresh) tras verificación exitosa
- DEBE crear una nueva sesión en la base de datos

### REQ-AUTH-005: Contraseña opcional

El sistema DEBE permitir al usuario crear una contraseña opcional después del registro.

- La contraseña DEBE tener mínimo 8 caracteres
- La contraseña NO DEBE ser igual al email
- DEBE aclarar al usuario que NO debe usar su contraseña real de Epic/Fortnite
- DEBE almacenar el hash de la contraseña (bcrypt, 12 rounds)

### REQ-AUTH-006: Apodo de usuario

El sistema DEBE requerir un apodo de usuario para realizar compras.

- El apodo DEBE ser único
- El apodo DEBE tener entre 3 y 20 caracteres alfanuméricos
- El apodo DEBE ser público (visible para el admin)
- El usuario PUEDE cambiar su apodo después de crearlo
- NO DEBE ser obligatorio para navegar la tienda

### REQ-AUTH-007: Gestión de sesiones

El sistema DEBE gestionar sesiones con las siguientes reglas:

- Máximo 2 sesiones activas simultáneas por usuario
- Al superar el límite, la sesión más antigua DEBE ser revocada
- El usuario PUEDE ver sus sesiones activas
- El usuario PUEDE cerrar sesiones individuales o todas
- Las sesiones DEBE persistir en la base de datos

### REQ-AUTH-008: Tokens JWT

El sistema DEBE usar tokens JWT para autenticación.

- Access token: 15 minutos de expiración
- Refresh token: 7 días de expiración
- Los tokens DEBE almacenarse en cookies httpOnly
- Las cookies DEBE tener secure flag en producción
- Las cookies DEBE tener sameSite=lax
- DEBE soportar refresh automático cuando el access token expira

### REQ-AUTH-009: Middleware de protección

El sistema DEBE proteger las rutas con middleware.

- `requireAuth`: protege `/account/*` y rutas que requieren login
- `requireAdmin`: protege `/admin/*`, requiere rol ADMIN o SUPER_ADMIN
- `requireSuperAdmin`: requiere rol SUPER_ADMIN
- Si no autenticado: redirigir a `/login`
- Si sin permisos: redirigir a `/`

### REQ-AUTH-010: Roles de usuario

El sistema DEBE soportar los siguientes roles:

- `USER`: cliente normal
- `ADMIN`: puede operar pedidos, gestionar amistades, ver métricas
- `SUPER_ADMIN`: puede todo lo de ADMIN + gestionar otros admins + configuración global

### REQ-AUTH-011: Login de Admin

El sistema DEBE permitir login de admin con email/usuario + contraseña.

- DEBE usar email O nombre de usuario
- La contraseña DEBE ser obligatoria
- DEBE usar cookies separadas con prefijo `admin`
- DEBE verificar que el usuario tenga rol ADMIN o SUPER_ADMIN

### REQ-AUTH-012: Rate limiting

El sistema DEBE aplicar rate limiting a los endpoints de autenticación.

- Endpoints de auth: 10 requests/minuto por IP
- Endpoints generales: 100 requests/minuto por IP
- DEBE usar Redis para tracking
- DEBE retornar HTTP 429 cuando se excede el límite

### REQ-AUTH-013: Seguridad

El sistema DEBE implementar las siguientes medidas de seguridad:

- NO almacenar contraseñas de Epic/Fortnite en texto plano
- Hash de contraseñas con bcrypt (12 rounds)
- Validación con Zod en todos los inputs
- Tokens JWT firmados con clave secreta
- Cookies httpOnly para prevenir XSS
- Rate limiting para prevenir brute force
