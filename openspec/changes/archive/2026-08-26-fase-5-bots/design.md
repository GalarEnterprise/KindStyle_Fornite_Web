# Design - Fase 5 Bot System

## Contexto

Los modelos Prisma ya existen (`FulfillmentAccount`, `FriendshipRequest`, `FriendshipRequestBot` con enums `BotStatus`, `Platform`, `BotRequestStatus`, `FriendshipStatus`). Los directorios scaffold están vacíos: `lib/services/bot/`, `lib/services/friendship/`, `app/admin/bots/`, `app/admin/friendships/`, `app/account/bots/`.

## Decisiones

### 1. Migración única: `request_id` opcional
`FriendshipRequest.request_id` pasa a `String?`. Sin FK declarada en schema actual, el cambio es seguro. Permite configuración previa a la compra.

### 2. Asignación capacity-based transaccional
```
assignBots(tx, friendshipRequest, count):
  bots = tx.fulfillment_account.findMany({
    where: { status: ACTIVE, current_usage: { lt: prisma.fulfillment_account.fields.capacity } },
    orderBy: { current_usage: 'asc' },   // menos cargados primero
    take: count,
  })
  if (bots.length < count) → NO_BOTS_AVAILABLE
  crear FriendshipRequestBot por cada uno + incrementar current_usage
```
- Comparación `current_usage < capacity` con `fields.` reference para evitar carrera
- Re-asignación de bot faltante (`SOLICITAR` desde panel cliente): busca UN bot no asignado aún a ese usuario y lo agrega SIN tocar los existentes (regla: no resetear)

### 3. Estados derivados del friendship request
- CREATED → al asignar bots pasa a PROCESSING
- Con ≥1 bot REQUEST_SENT → WAITING_ACCEPTANCE
- Con ≥1 bot ACCEPTED (confirmado) → PARTIALLY_READY
- Todos confirmados → READY
- Recalculado en cada acción admin, función pura `deriveStatus(bots)`

### 4. Flujo de acciones admin (manual, sin automatización)
| Acción | Efecto |
|---|---|
| MARCAR SOLICITUD ENVIADA | `request_status=REQUEST_SENT`, `request_sent_at=now`, evento `FRIEND_REQUEST_SENT`, recalcular status |
| CONFIRMAR AMISTAD | `friendship_status=ACCEPTED`, `friendship_confirmed_at=now`, evento `FRIENDSHIP_CONFIRMED`, recalcular status. NO calcula eligibility_at (Fase 6) |
| ABRIR CUENTA | Solo frontend: link a la cuenta del bot (campo `external_identifier`) |

Guardas: acción idempotente si ya está en el estado destino; 409 si intenta confirmar sin solicitud enviada.

### 5. Cola admin priorizada
`GET /api/admin/friendships` ordena: solicitudes con bots PENDING primero (sin procesar), luego `created_at ASC`. Vista detallada incluye bots + datos del cliente con botón COPIAR ID.

### 6. Estado "preparación" para banner/navbar
`GET /api/friendship/status` devuelve `{ status, confirmedBots, requiredBots }`:
- null (sin registro) → banner "agregar ID", CTA AGREGAR BOTS
- PROCESSING/WAITING/PARTIAL → banner preparación `X de Y`, CTA BOTS 🟡
- READY → banner listo, CTA BOTS ✓

### 7. Roles
- Cliente: `/api/friendship*` con `getAuthUser`
- Admin: `/api/admin/*` con `requireAdmin`

## Riesgos

- **Carrera en asignación**: mitigada con transacción + comparación por campos
- **Agotamiento de bots**: error explícito NO_BOTS_AVAILABLE; UI muestra mensaje y sugerencia de contactar soporte
