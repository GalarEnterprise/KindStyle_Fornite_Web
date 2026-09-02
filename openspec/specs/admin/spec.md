# Panel de Administración

## Purpose

Proporcionar a los administradores una interfaz centralizada para gestionar solicitudes, pagos, amistades, bots, configuración, usuarios y auditoría del sistema.

## Rutas

- `/admin/dashboard` - Métricas generales
- `/admin/requests` - Solicitudes de productos
- `/admin/friendships` - Cola de amistades
- `/admin/bots` - Gestión de bots
- `/admin/payments` - Validación de pagos
- `/admin/settings` - Configuración
- `/admin/users` - Gestión de admins (solo Super Admin)
- `/admin/audit` - Registro de auditoría

## Roles

### Super Admin
- Todo lo que puede hacer Admin
- Crear/eliminar admins
- Quitar acceso a admins
- Configuración global
- Ver credenciales de usuarios (después de validar pago)

### Admin
- Operar pedidos
- Gestionar amistades
- Validar pagos
- Ver métricas
- Gestionar bots
- Configurar precios

## ADDED Requirements

### Requirement: Admin Dashboard Metrics
El sistema DEBE mostrar un panel con métricas clave de negocio para el admin.

#### Scenario: View dashboard
- **WHEN** admin navigates to `/admin/dashboard`
- **THEN** system displays metrics: orders (day/week/month), revenue (day/week/month), pending validations, active friendships, active bots

#### Scenario: Metrics are real-time
- **WHEN** admin views dashboard
- **THEN** metrics reflect current database state without requiring page refresh

### Requirement: Admin Requests Panel
El sistema DEBE proporcionar un panel para ver y gestionar todas las solicitudes de clientes.

#### Scenario: View requests list
- **WHEN** admin navigates to `/admin/requests`
- **THEN** system displays requests ordered by `created_at DESC` with status filter

#### Scenario: Filter by status
- **WHEN** admin selects a status filter
- **THEN** system displays only requests matching that status

#### Scenario: View request detail
- **WHEN** admin clicks on a request
- **THEN** system displays client info, Fortnite ID, products, friendship request status, and payment status

#### Scenario: Copy request ID
- **WHEN** admin clicks copy button on request ID
- **THEN** system copies the request number to clipboard

### Requirement: Admin Friendships Panel
El sistema DEBE proporcionar un panel para gestionar solicitudes de amistad con orden de prioridad.

#### Scenario: View friendships queue
- **WHEN** admin navigates to `/admin/friendships`
- **THEN** system displays friendships ordered by: eligibility_at ASC (soonest), created_at ASC (oldest), unprocessed first

#### Scenario: View friendship detail
- **WHEN** admin clicks on a friendship
- **THEN** system displays client info, assigned bots with individual statuses and timer countdowns

#### Scenario: Send friendship request
- **WHEN** admin clicks "ENVIAR SOLICITUD" on a bot
- **THEN** system updates bot status to `REQUEST_SENT` and logs the action

#### Scenario: Mark request sent
- **WHEN** admin clicks "MARCAR ENVIADA"
- **THEN** system updates bot status to `REQUEST_SENT` and logs the action

#### Scenario: Confirm friendship
- **WHEN** admin clicks "CONFIRMAR AMISTAD"
- **THEN** system updates bot friendship_status to `ACCEPTED`, sets `friendship_confirmed_at`, starts timer, and logs the action

### Requirement: Admin Bots Panel
El sistema DEBE proporcionar un panel para gestionar cuentas de cumplimiento.

#### Scenario: View bots list
- **WHEN** admin navigates to `/admin/bots`
- **THEN** system displays all bots with name, platform, status, and current assignments

#### Scenario: Add new bot
- **WHEN** admin submits new bot form (name, platform, external_id)
- **THEN** system creates bot record and logs the action

#### Scenario: Edit bot
- **WHEN** admin updates bot details (capacity, status)
- **THEN** system persists changes and logs the action

#### Scenario: Deactivate bot
- **WHEN** admin deactivates a bot
- **THEN** system sets bot status to `INACTIVE` and logs the action

### Requirement: Admin Settings Panel
El sistema DEBE proporcionar un panel de configuración para ajustes globales.

#### Scenario: View settings
- **WHEN** admin navigates to `/admin/settings`
- **THEN** system displays current configuration: V-Buck ratio, friendship period, WhatsApp number, email contact

#### Scenario: Update V-Buck ratio
- **WHEN** admin updates the V-Buck to MXN ratio
- **THEN** system persists the new ratio and future price calculations use it

#### Scenario: Update friendship period
- **WHEN** admin updates the friendship period (hours)
- **THEN** system persists the new period and future timer calculations use it

#### Scenario: Force catalog sync
- **WHEN** admin clicks "Forzar sync"
- **THEN** system triggers catalog synchronization and displays last sync timestamp

### Requirement: Admin Users Panel
El sistema DEBE proporcionar un panel de gestión de usuarios restringido a Super Admin.

#### Scenario: Super Admin views admin list
- **WHEN** Super Admin navigates to `/admin/users`
- **THEN** system displays all admin accounts with role and status

#### Scenario: Super Admin creates admin
- **WHEN** Super Admin submits new admin form (email, role)
- **THEN** system creates admin account and logs the action

#### Scenario: Super Admin deactivates admin
- **WHEN** Super Admin deactivates an admin account
- **THEN** system disables admin access and logs the action

#### Scenario: Non-Super Admin cannot access
- **WHEN** regular Admin navigates to `/admin/users`
- **THEN** system redirects to dashboard

### Requirement: Admin Audit Log
El sistema DEBE registrar todas las acciones de admin y proporcionar un registro de auditoría consultable.

#### Scenario: Log admin action
- **WHEN** admin performs any action (validate payment, confirm friendship, etc.)
- **THEN** system creates EventLog entry with admin_id, action, entity, entity_id, metadata, timestamp

#### Scenario: View audit log
- **WHEN** admin navigates to `/admin/audit`
- **THEN** system displays log entries ordered by timestamp DESC with entity and action filters

#### Scenario: Filter audit log
- **WHEN** admin selects entity or action filter
- **THEN** system displays only matching log entries

### Requirement: Collapsible Admin Sidebar Navigation
El sistema DEBE permitir al administrador retraer y volver a mostrar el sidebar de navegación del panel de administración a voluntad, de forma que el sidebar no bloquee la visualización del contenido de las secciones en ninguna pantalla.

El sidebar DEBE seguir siendo accesible en ambos estados mediante un botón de toggle visible. Ninguna sección, ruta o dato del panel DEBE modificarse por este comportamiento; solo su presentación.

#### Scenario: Toggle visible en ambos estados
- **WHEN** el administrador abre cualquier sección del panel de administración en cualquier tamaño de pantalla
- **THEN** se muestra un botón de toggle que permite retraer o volver a mostrar el sidebar

#### Scenario: Sidebar oculto por defecto en móvil
- **WHEN** el administrador accede al panel en una pantalla de ancho inferior al breakpoint grande (`< lg`, p. ej. ~375px)
- **THEN** el sidebar NO ocupa espacio del contenido (está retraído por defecto) y el contenido de la sección usa el ancho completo de la pantalla

#### Scenario: Abrir sidebar como drawer en móvil
- **WHEN** el administrador presiona el botón de toggle en una pantalla móvil con el sidebar retraído
- **THEN** el sidebar se muestra como drawer superpuesto sobre el contenido con un overlay oscuro que cubre el resto de la pantalla

#### Scenario: Cierre del drawer en móvil
- **WHEN** el administrador toca el overlay, presiona Escape, o navega a otra sección del panel con el drawer abierto en móvil
- **THEN** el drawer se cierra y el contenido vuelve a ocupar el ancho completo

#### Scenario: Retraer sidebar en desktop
- **WHEN** el administrador presiona el botón de toggle en una pantalla grande (`≥ lg`) con el sidebar visible
- **THEN** el sidebar se retrae por completo y el contenido ocupa el ancho completo; al presionar de nuevo el toggle el sidebar se muestra otra vez

#### Scenario: Persistencia del estado de retención
- **WHEN** el administrador retrae o muestra el sidebar en una pantalla grande y recarga la página o navega entre secciones
- **THEN** el sidebar conserva el último estado elegido por el administrador (persistido por navegador, p. ej. localStorage)

#### Scenario: Estado inicial en móvil no afecta desktop
- **WHEN** el administrador abre el panel en un dispositivo móvil
- **THEN** el drawer inicia cerrado independientemente del estado persistido en escritorio

## Payments Panel

Ruta: `/admin/payments`

- Lista de pagos pendientes
- Ver comprobante (descargar)
- Validar / Rechazar
- Agregar nota al rechazar
- Ver historial

### Acciones sobre pago
```
[ VALIDAR PAGO ] → Estado: PAID
[ RECHAZAR ] → Modal para motivo + nota → Estado: REJECTED
[ DESCARGAR COMPROBANTE ]
```

Al rechazar:
- Notificar cliente con motivo
- Cliente puede volver a subir comprobante

## Settings Panel

Ruta: `/admin/settings`

### Configuración General
- Moneda predeterminada
- Ratio V-Bucks (100 V = 7.5 MXN default)
- Período de amistad (48h default, configurable)
- WhatsApp número
- Email contacto

### Gestión de Precios
- Precio por producto individual
- Precios de V-Bucks (1000, 2800, 5000, 13500)
- Precios de Crew/Battle Pass

### Sincronización
- Forzar sync de catálogo
- Ver último snapshot
- Configurar intervalo de sync

## Credenciales Especiales

Para V-Bucks/Crew/Battle Pass:
- Admin NO puede ver credenciales hasta validar pago
- Después de validar: puede ver email + contraseña
- Antes de validar: solo ve que existen credenciales encriptadas
