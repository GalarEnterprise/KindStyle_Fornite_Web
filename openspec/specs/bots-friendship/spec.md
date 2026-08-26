# Sistema de Bots y Amistades

## Concepto

Los bots son cuentas de Epic Games (vinculadas a Xbox/PlayStation) que el vendedor usa para enviar solicitudes de amistad al cliente, permitiendo el gifting.

## Configuración Inicial

- **5 bots** para comenzar
- Todos son cuentas Epic vinculadas a todas las plataformas
- Límite: 1000 amigos por bot (Epic)
- Nombres personalizados: KindStyle 1, KindStyle 2, Claudio 1.1, etc.

## FulfillmentAccount (Bot)

```
id, name, platform, status,
capacity, daily_limit, current_usage,
external_identifier,
created_at, updated_at
```

### Estados
```
ACTIVE
COOLDOWN
LIMITED
UNAVAILABLE
DISABLED
ERROR
```

## Friendship Request

### Entidad
```
id, request_id, user_id,
platform, platform_user_id,
status, required_bots,
created_at, updated_at
```

### Estados
```
CREATED
PROCESSING
WAITING_ACCEPTANCE
PARTIALLY_READY
READY
CANCELLED
```

## Friendship Request Bots

Tabla intermedia que rastrea cada bot asignado a un cliente.

```
id,
friendship_request_id, fulfillment_account_id,
request_status, friendship_status,
request_sent_at, friendship_confirmed_at,
eligibility_at,
created_at, updated_at
```

### request_status
```
PENDING
REQUEST_SENT
```

### friendship_status
```
PENDING
ACCEPTED
REJECTED
UNKNOWN
```

## Flujo de Amistad

```
Cliente registra ID (plataforma + ID)
    ↓
"SOLICITAR BOTS DE AMISTAD"
    ↓
Confirmación de datos
    ↓
Sistema asigna bots disponibles (capacity based)
    ↓
Admin ve solicitud en cola
    ↓
Admin abre cuenta del bot → envía solicitud de amistad
    ↓
[MARCAR SOLICITUD ENVIADA]
    ↓
Cliente acepta en su buzón
    ↓
Admin verifica → [CONFIRMAR AMISTAD]
    ↓
Timer individual inicia (friendship_confirmed_at)
    ↓
eligibility_at = friendship_confirmed_at + configured_period
    ↓
Bot elegible
```

## Reglas Importantes

1. **NO resetear timers**: Al agregar nuevo bot, los existentes mantienen su timer
2. **Cronómetro individual**: Cada bot tiene su propio timer
3. **Elegibilidad parcial**: Un cliente puede ser elegible con 1 bot, no necesita todos
4. **Required bots configurable**: No todos los productos requieren misma cantidad

## Selector de Plataforma

```
¿Dónde tienes tu cuenta?

[ Epic Games ]
[ Xbox ]
[ PlayStation ]
```

Según selección:
- Epic → ID de Epic Games
- Xbox → Gamertag
- PlayStation → PSN ID

Almacenar: `platform` + `platform_user_id` (no campo genérico)

## Panel Cliente - Bots

Ruta: `/account/bots`

```
MIS BOTS

KindStyle 1 — Epic
🟢 Amigo
⏱ 21h 42m restantes

KindStyle 2 — Epic
🟢 Amigo
⏱ 27h 18m restantes

Claudio 1.1 — Epic
🟡 Solicitud enviada
Esperando aceptación

KindStyle 3 — Epic
⚪ No agregado
[ SOLICITAR ]
```

## Panel Admin - Friendships

Ruta: `/admin/friendships`

Orden prioritario:
1. Timer más cercano a completarse (`eligibility_at ASC`)
2. Usuarios esperando desde más tiempo (`created_at ASC`)
3. Solicitudes sin procesar

### Vista Detallada

```
FRIENDSHIP REQUEST
Request: FR-20260823-0042
User ID: Pablito123
Platform: Epic Games
[ COPIAR ID ]
Solicitud creada: 23 Ago — 23:41

BOTS

BOT 1 — KindStyle 1
[ ABRIR CUENTA ]
Solicitud enviada: ✓ 23 Ago — 23:53
Amistad: ✓ 23 Ago — 00:12
Timer: 23 Ago 00:12 → 25 Ago 00:12

BOT 2 — KindStyle 2
[ ABRIR CUENTA ]
Solicitud enviada: ✓
Amistad: ✗
[ CONFIRMAR AMISTAD ]

BOT 3 — Claudio 1.1
Solicitud: ✗
[ ENVIAR SOLICITUD ]
```

### Acciones Admin

- **[ABRIR CUENTA]**: Lleva al vendedor a la cuenta del bot (manual)
- **[MARCAR SOLICITUD ENVIADA]**: Registra `request_sent_at` + evento `FRIEND_REQUEST_SENT`
- **[CONFIRMAR AMISTAD]**: Registra `friendship_confirmed_at` + evento `FRIENDSHIP_CONFIRMED` + inicia timer

## Banner en Tienda

### Sin bots
```
Agrega tu ID de plataforma para acelerar tu servicio
[ ? ] [ CONTÁCTANOS ]
[ AGREGAR BOTS ]
```

### Parcialmente preparado
```
Tu cuenta está en preparación
2 de 3 bots agregados
[ VER MIS BOTS ]
```

### Listo
```
🟢 Tu cuenta está preparada para gifting
[ VER MIS BOTS ]
```

## CTA en Navbar

- Sin config: `AGREGAR BOTS ✨` (con glow/animación sutil)
- Pendientes: `BOTS 🟡`
- Listo: `BOTS ✓`

## Info Modal [?]

Explicar:
```
¿Por qué necesitamos agregarte como amigo?

Para poder enviarte regalos de Fortnite,
nuestras cuentas de entrega deben agregarte
como amigo.

Fortnite establece un período mínimo de amistad
antes de que pueda realizarse el gifting.

Por eso recomendamos configurar tus bots
antes de realizar tu solicitud.

Mientras antes los agregues, antes podremos
preparar tu cuenta para tus regalos.
```

NO hardcodear "48 horas". Usar valor configurable.
