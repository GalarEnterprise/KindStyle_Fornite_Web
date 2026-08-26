# Fases de Implementación - KindStyle

## Estructura OpenSpec

```
openspec/
├── config.yaml                          # Configuración del proyecto
├── specs/                               # Especificaciones principales
│   ├── OVERVIEW.md                      # Resumen general del proyecto
│   ├── auth/spec.md                     # Sistema de autenticación
│   ├── catalog/spec.md                  # Catálogo de productos
│   ├── cart/spec.md                     # Carrito de compras
│   ├── requests/spec.md                 # Sistema de solicitudes
│   ├── bots-friendship/spec.md          # Bots y amistades
│   ├── payments/spec.md                 # Sistema de pagos
│   ├── currency/spec.md                 # Monedas y conversión
│   ├── notifications/spec.md            # Notificaciones
│   ├── admin/spec.md                    # Panel de administración
│   └── timers/spec.md                   # Cronómetros individuales
│
└── changes/                             # Cambios propuestos por fase
    ├── fase-0-foundation/               # ✅ Creado
    ├── fase-1-catalog/                  # ⏭️ Pendiente
    ├── fase-2-auth/                     # ⏭️ Pendiente
    ├── fase-3-cart/                     # ⏭️ Pendiente
    ├── fase-4-requests/                 # ⏭️ Pendiente
    ├── fase-5-bots/                     # ⏭️ Pendiente
    ├── fase-6-timers/                   # ⏭️ Pendiente
    ├── fase-7-payments/                 # ⏭️ Pendiente
    ├── fase-8-notifications/            # ⏭️ Pendiente
    └── fase-9-admin/                    # ⏭️ Pendiente
```

---

## Fases

### FASE 0 - Foundation ✅
**Status**: Propuesto  
**Change**: `fase-0-foundation`  
**Duración estimada**: 15-20 minutos

**Objetivo**: Establecer infraestructura base del monorepo.

**Entregables**:
- Monorepo configurado
- PostgreSQL + Redis en Docker
- Schema de Prisma completo
- Scripts de desarrollo funcionando
- TypeScript + ESLint configurados

**Archivos**:
- `openspec/changes/fase-0-foundation/proposal.md`
- `openspec/changes/fase-0-foundation/design.md`
- `openspec/changes/fase-0-foundation/tasks.md`

---

### FASE 1 - Catálogo ⏭️
**Status**: Pendiente  
**Change**: `fase-1-catalog` (crear con `/opsx-propose`)  
**Duración estimada**: 4-6 horas

**Objetivo**: Implementar sincronización de catálogo desde Fortnite API.

**Entregables**:
- Integración con Community Fortnite API
- Sistema de snapshots
- Motor de giftability
- API routes para productos
- Organización por colecciones
- Búsqueda y filtros

**Specs afectadas**: `catalog`

---

### FASE 2 - Autenticación ⏭️
**Status**: Pendiente  
**Change**: `fase-2-auth` (crear con `/opsx-propose`)  
**Duración estimada**: 3-4 horas

**Objetivo**: Implementar sistema de autenticación para clientes y admins.

**Entregables**:
- Login con email + código de verificación
- Registro con elección de nickname
- Sistema de sesiones (máx 2 simultáneas)
- Contraseña opcional
- Login de admin (email/usuario + contraseña)
- Roles: USER, ADMIN, SUPER_ADMIN

**Specs afectadas**: `auth`

---

### FASE 3 - Carrito ⏭️
**Status**: Pendiente  
**Change**: `fase-3-cart` (crear con `/opsx-propose`)  
**Duración estimada**: 2-3 horas

**Objetivo**: Implementar carrito con soporte para productos especiales.

**Entregables**:
- Agregar/remover productos
- Modal para credenciales (V-Bucks/Crew/Battle Pass)
- Encriptación de credenciales
- Persistencia (localStorage + DB)
- Validación de productos

**Specs afectadas**: `cart`

---

### FASE 4 - Request System ⏭️
**Status**: Pendiente  
**Change**: `fase-4-requests` (crear con `/opsx-propose`)  
**Duración estimada**: 3-4 horas

**Objetivo**: Implementar sistema de solicitudes con Request ID y WhatsApp.

**Entregables**:
- Generación de Request ID (REQ-YYYYMMDD-XXXX)
- Generador de mensaje para WhatsApp
- Botón copiar solicitud
- Integración wa.me
- Tracking de apertura de WhatsApp
- Estados de request

**Specs afectadas**: `requests`

---

### FASE 5 - Bot System ⏭️
**Status**: Pendiente  
**Change**: `fase-5-bots` (crear con `/opsx-propose`)  
**Duración estimada**: 4-5 horas

**Objetivo**: Implementar sistema de bots y solicitudes de amistad.

**Entregables**:
- Gestión de bots (CRUD)
- Selector de plataforma (Epic/Xbox/PlayStation)
- Solicitud de amistad del usuario
- Asignación de bots (capacity based)
- Panel admin de amistades
- Acciones: enviar solicitud, marcar enviada, confirmar amistad
- Banner de preparación

**Specs afectadas**: `bots-friendship`

---

### FASE 6 - Individual Timers ⏭️
**Status**: Pendiente  
**Change**: `fase-6-timers` (crear con `/opsx-propose`)  
**Duración estimada**: 3-4 horas

**Objetivo**: Implementar cronómetros individuales por bot.

**Entregables**:
- Cálculo de eligibility_at
- Delayed jobs (BullMQ)
- Componente de countdown
- Regla: no resetear timers existentes
- Notificaciones al iniciar/completar timer

**Specs afectadas**: `timers`

---

### FASE 7 - Pagos ⏭️
**Status**: Pendiente  
**Change**: `fase-7-payments` (crear con `/opsx-propose`)  
**Duración estimada**: 4-5 horas

**Objetivo**: Implementar sistema de pagos manual (transferencia + OXXO).

**Entregables**:
- Página de pagos con lista de pedidos
- Selección de método (Transferencia/OXXO)
- Copiar datos bancarios
- Upload de comprobante
- Tracker visual de validación
- Panel admin de validación
- Notificaciones de validación/rechazo
- Popup post-pago para número WhatsApp

**Specs afectadas**: `payments`

---

### FASE 8 - Notificaciones ⏭️
**Status**: Pendiente  
**Change**: `fase-8-notifications` (crear con `/opsx-propose`)  
**Duración estimada**: 3-4 horas

**Objetivo**: Implementar sistema de notificaciones multi-canal.

**Entregables**:
- Notificaciones web (campanita + dropdown)
- Integración Resend (email)
- Templates de notificaciones
- Preferencias de usuario
- Worker de notificaciones

**Specs afectadas**: `notifications`

---

### FASE 9 - Admin Dashboard ⏭️
**Status**: Pendiente  
**Change**: `fase-9-admin` (crear con `/opsx-propose`)  
**Duración estimada**: 4-5 horas

**Objetivo**: Implementar panel de administración completo.

**Entregables**:
- Dashboard con métricas
- Panel de requests
- Panel de friendships (cola priorizada)
- Panel de bots
- Panel de pagos
- Configuración (monedas, precios)
- Gestión de admins (Super Admin)
- Audit log

**Specs afectadas**: `admin`

---

## Proceso de Trabajo

### Para cada fase:

1. **Crear change**:
   ```bash
   # Usar comando de OpenSpec
   /opsx-propose fase-X-nombre
   ```

2. **Revisar artefactos**:
   - proposal.md (qué y por qué)
   - design.md (cómo)
   - tasks.md (pasos)

3. **Implementar**:
   ```bash
   /opsx-apply fase-X-nombre
   ```

4. **Verificar**:
   - Tests pasan
   - TypeScript compila
   - ESLint pasa
   - Funcionalidad según spec

5. **Archivar**:
   ```bash
   /opsx-archive fase-X-nombre
   ```

---

## Reglas Importantes

✅ **Completar una fase antes de empezar la siguiente**  
✅ **Ejecutar tests después de cada fase**  
✅ **Documentar decisiones en commits**  
✅ **No saltar fases**  
✅ **Actualizar AGENTS.md si hay cambios de convenciones**

❌ **NO implementar pagos online en MVP**  
❌ **NO implementar fulfillment automático en MVP**  
❌ **NO implementar verificación automática de destinatario**

---

## Notas

- Cada fase es un "change" en OpenSpec
- Las specs en `openspec/specs/` son las especificaciones principales
- Cada change tiene sus propias specs delta (cambios a las specs principales)
- Al archivar un change, se sincronizan las specs principales con los deltas
