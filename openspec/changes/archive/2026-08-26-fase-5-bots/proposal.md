# Fase 5 - Bot System

## Qué

Implementar el sistema de bots (FulfillmentAccounts) y solicitudes de amistad: gestión admin de bots, registro del ID de plataforma por el cliente con selector Epic/Xbox/PlayStation, asignación capacity-based de bots disponibles, panel admin de friendships con flujo manual (enviar solicitud → marcar enviada → confirmar amistad), panel cliente de bots, banner de preparación en la tienda y CTA en navbar.

## Por Qué

El gifting de Fortnite requiere que las cuentas de entrega (bots) sean amigos del cliente y que la amistad cumpla un período mínimo. Esta fase habilita el flujo de amistad completo; los timers individuales se implementan en Fase 6 sobre `friendship_confirmed_at`.

## Alcance

### In-scope
- CRUD admin de bots (`/admin/bots`): crear, editar nombre/plataforma/límites, cambiar estado (ACTIVE, COOLDOWN, LIMITED, UNAVAILABLE, DISABLED, ERROR)
- Endpoint cliente para registrar ID de plataforma: `platform` + `platform_user_id` (sin campo genérico)
- Creación de FriendshipRequest + asignación transaccional capacity-based de bots (ACTIVE con `current_usage < capacity`)
- Panel admin `/admin/friendships`: cola priorizada (created_at ASC sin procesar primero), vista detallada por solicitud
- Acciones admin manuales: ABRIR CUENTA (link externo), MARCAR SOLICITUD ENVIADA (`request_sent_at` + evento `FRIEND_REQUEST_SENT`), CONFIRMAR AMISTAD (`friendship_confirmed_at` + evento `FRIENDSHIP_CONFIRMED`)
- Panel cliente `/account/bots`: estado por bot (no agregado / solicitud enviada / amigo) y acción SOLICITAR para bot faltante
- Banner en tienda con 3 estados: sin bots, parcialmente preparado, listo
- CTA en navbar según estado: `AGREGAR BOTS ✨` / `BOTS 🟡` / `BOTS ✓`
- Info modal explicando por qué se necesita la amistad (sin hardcodear período)
- Eventos en `EventLog` para trazabilidad

### Non-goals
- No calcular `eligibility_at` ni implementar timers/countdowns (Fase 6)
- No enviar solicitudes automáticamente — el admin opera las cuentas manualmente
- No verificar aceptación automática de amistad
- No implementar notificaciones email/WhatsApp de progreso (Fase 8)

## Supuestos

1. **`request_id` opcional**: migración Prisma cambia `FriendshipRequest.request_id` a `String?` — el cliente puede configurar bots ANTES de comprar (el spec lo recomienda explícitamente). Se vincula al Request cuando exista.
2. **`required_bots` default 1**: la configuración por-producto queda fuera de alcance; el valor es editable en DB.
3. **Un solo FriendshipRequest activo por usuario** (`@@unique` implícito vía user_id + status activo).
4. **Período de amistad**: no se usa en esta fase; su configuración llega con Fase 6.

## Impacto

- Migración Prisma: `request_id String?` en `friendship_requests`
- Nuevos servicios: `bot-service.ts`, `friendship-service.ts`
- Nuevas rutas API: `/api/bots/*`, `/api/friendship`
- Nuevas páginas: `/account/bots`, `/admin/bots`, `/admin/friendships`
- Modificaciones: header (CTA), shop (banner), layout account
