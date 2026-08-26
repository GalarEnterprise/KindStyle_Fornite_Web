# Panel de Administración

## Rutas

- `/admin/dashboard` - Métricas generales
- `/admin/requests` - Solicitudes de productos
- `/admin/friendships` - Cola de amistades
- `/admin/bots` - Gestión de bots
- `/admin/payments` - Validación de pagos
- `/admin/settings` - Configuración
- `/admin/users` - Gestión de admins (solo Super Admin)

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

## Dashboard

Métricas:
- Pedidos del día/semana/mes
- Ingresos del día/semana/mes
- Pedientes de validación
- Amistades en proceso
- Bots activos
- Conversión WhatsApp

## Requests Panel

Ruta: `/admin/requests`

Orden: `created_at DESC`

Filtros: NEW, CONTACTED, UNDER_REVIEW, PAYMENT_PENDING, PAID, FULFILLMENT_PENDING, FULFILLED, CANCELLED

Datos visibles:
- Request ID + [COPIAR]
- Cliente (nombre/email)
- WhatsApp
- Fortnite ID + [COPIAR]
- Plataforma
- Productos (lista)
- Tipo de producto
- Fecha
- Estado
- Friendship Request

## Friendships Panel

Ruta: `/admin/friendships`

Orden prioritario:
1. `eligibility_at ASC` (timer más cercano)
2. `created_at ASC` (más antiguo esperando)
3. Sin procesar

### Vista de Lista
```
SOLICITUDES DE AMISTAD

🔴 Pablito123
Esperando: 18h 32m

🟡 monsexx
Esperando: 11h 02m

🟡 juanitopro
Esperando: 4h 21m
```

### Vista Detallada
- Info del cliente
- Lista de bots asignados
- Estado de cada bot
- Acciones: [ENVIAR SOLICITUD], [MARCAR ENVIADA], [CONFIRMAR AMISTAD]
- Timers individuales

## Bots Panel

Ruta: `/admin/bots`

- Lista de todos los bots
- Agregar nuevo bot (nombre, plataforma, external_id)
- Editar bot (capacidad, estado)
- Ver asignaciones actuales
- Desactivar/activar

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

## Users Panel (Solo Super Admin)

Ruta: `/admin/users`

- Lista de admins
- Crear nuevo admin
- Editar permisos
- Desactivar/eliminar acceso

## Audit Log

Toda acción admin se registra:
```
admin_id, action, entity, entity_id, metadata, timestamp
```

Ejemplos:
- admin marked request sent
- admin confirmed friendship
- admin started timer
- admin disabled bot
- admin validated payment
- admin rejected payment

## Credenciales Especiales

Para V-Bucks/Crew/Battle Pass:
- Admin NO puede ver credenciales hasta validar pago
- Después de validar: puede ver email + contraseña
- Antes de validar: solo ve que existen credenciales encriptadas
