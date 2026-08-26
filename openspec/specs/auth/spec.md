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
