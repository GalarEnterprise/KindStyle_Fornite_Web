# Sistema de Timers Individuales

## Concepto

Cada bot tiene su propio cronómetro independiente. NO hay timer global.

## Reglas Fundamentales

1. **Fuente de verdad**: PostgreSQL (no localStorage, no browser timer)
2. **Frontend**: Solo calcula visualmente `eligibility_at - current_time`
3. **Backend**: Determina si ya es elegible
4. **Independencia**: Agregar nuevo bot NO resetea timers existentes

## Campos por Bot

```typescript
interface FriendshipRequestBot {
  friendship_confirmed_at: Date | null
  eligibility_at: Date | null
}
```

## Cálculo

```
friendship_confirmed_at + configured_friendship_period = eligibility_at
```

El período es configurable (default: 48 horas, pero NO hardcodear).

## Ejemplo de Múltiples Timers

```
BOT 1 (KindStyle 1)
Amistad confirmada: 23 Ago 12:00
Eligible: 25 Ago 12:00
Restante: 20h

BOT 2 (KindStyle 2)
Amistad confirmada: 23 Ago 15:00
Eligible: 25 Ago 15:00
Restante: 23h

BOT 3 (Claudio 1.1)
Amistad confirmada: 24 Ago 10:00
Eligible: 26 Ago 10:00
Restante: 42h

BOT 4 (KindStyle 3)
Recién agregado
Timer no iniciado
```

## Visualización Cliente

```
MIS BOTS

KindStyle 1 — Epic
🟢 Amigo
⏱ 20h 15m restantes

KindStyle 2 — Epic
🟢 Amigo
⏱ 23h 42m restantes

Claudio 1.1 — Epic
🟡 Solicitud enviada
Esperando aceptación

KindStyle 3 — Epic
⚪ No agregado
[ SOLICITAR ]
```

## Timer Architecture

### Backend
```
friendship_confirmed_at
    ↓
Delayed Job (BullMQ)
    ↓
Worker ejecuta en eligibility_at
    ↓
Evento: BOT_TIMER_COMPLETED
    ↓
Notificaciones: Web + Email + WhatsApp
```

### Recovery
- Checker periódico para recuperar jobs fallidos
- Si server reinicia, jobs se recuperan de Redis/DB

### Frontend
```typescript
// Solo visualización
const remaining = eligibility_at - new Date()
// Actualizar cada segundo con setInterval
```

## Query de Elegibilidad

```sql
SELECT friendship_request_bots
WHERE friendship_request_id = ?
  AND friendship_status = 'ACCEPTED'
  AND eligibility_at <= NOW()
  AND fulfillment_account.status = 'ACTIVE'
```

## Reglas de Entrega

- **ANY_ELIGIBLE_BOT**: Con 1 bot elegible basta (configurable)
- **N_ELIGIBLE_BOTS**: Requiere N bots elegibles (configurable por producto)

## Notificaciones

### Cuando inicia timer
```
🟢 Bot preparado

El Bot {name} ya está agregado a tu cuenta.
Tu período de espera ha comenzado.

Fecha de disponibilidad: {eligibility_date}
Tiempo restante: {remaining_time}
```

### Cuando timer completa
```
✅ Bot elegible

Tu bot {name} ya es elegible para enviarte regalos.
Ya podemos proceder con tu solicitud.
```

## No Resetear Timers

Cuando admin agrega nuevo bot al pool:
- Timers existentes NO se modifican
- Nuevo bot comienza su propio timer cuando se confirme amistad
- Cliente puede ver: "Nuevo bot disponible: [SOLICITAR]"

## Requerimientos

### Requirement: Timer Calculation Service
The system SHALL calculate `eligibility_at` as `friendship_confirmed_at + configured_friendship_period` for each bot when friendship is confirmed.

#### Scenario: Timer starts on friendship confirmation
- **WHEN** admin confirms friendship for a bot (`FRIENDSHIP_CONFIRMED` event)
- **THEN** system sets `eligibility_at = NOW() + configured_friendship_period` and persists to database

#### Scenario: Timer uses configurable period
- **WHEN** friendship period is configured (default: 48h)
- **THEN** system uses the configured value, NOT a hardcoded constant

### Requirement: BullMQ Delayed Jobs
The system SHALL schedule a BullMQ delayed job at `eligibility_at` for each bot timer.

#### Scenario: Job scheduled on timer start
- **WHEN** timer calculation completes successfully
- **THEN** system enqueues a delayed job to `timers` queue with delay = `eligibility_at - NOW()` in milliseconds

#### Scenario: Job ID is deterministic
- **WHEN** multiple timer starts occur for the same bot
- **THEN** system uses bot ID + request ID as job key to prevent duplicate timers

### Requirement: Timer Worker
The system SHALL process completed timer jobs to mark bots as eligible.

#### Scenario: Timer completion
- **WHEN** delayed job fires
- **THEN** worker updates `friendship_request_bots` row, logs `BOT_TIMER_COMPLETED` event, and triggers notifications

#### Scenario: Worker handles errors gracefully
- **WHEN** timer job fails (e.g., database timeout)
- **THEN** worker retries with exponential backoff and logs error to EventLog

### Requirement: Eligibility Query
The system SHALL provide a query to find all eligible bots for a given friendship request.

#### Scenario: Query returns eligible bots
- **WHEN** client requests bot eligibility status
- **THEN** system returns bots where `friendship_status = 'ACCEPTED'` AND `eligibility_at <= NOW()` AND bot `status = 'ACTIVE'`

### Requirement: Timer Recovery
The system SHALL recover failed timer jobs on server restart.

#### Scenario: Recovery on startup
- **WHEN** worker process starts
- **THEN** system scans for bots with `eligibility_at <= NOW()` and `friendship_status = 'ACCEPTED'` that haven't completed timer, and re-processes them

### Requirement: Frontend Countdown Display
The system SHALL display a countdown timer for each bot showing remaining time.

#### Scenario: Countdown shows remaining time
- **WHEN** bot has active timer (eligibility_at in the future)
- **THEN** frontend displays countdown as "Xh Ym restantes" updating every second

#### Scenario: Countdown completes
- **WHEN** eligibility_at is reached
- **THEN** frontend shows "Elegible" status without requiring page refresh

### Requirement: Timer Notifications
The system SHALL send notifications when timer starts and completes via the centralized notification service.

#### Scenario: Timer start notification
- **WHEN** timer starts (friendship confirmed)
- **THEN** system sends web + email notification: "Bot {name} preparado. Período de espera iniciado." via notification service

#### Scenario: Timer complete notification
- **WHEN** timer completes (eligibility reached)
- **THEN** system sends web + email + WhatsApp notification: "Bot {name} elegible para enviarte regalos." via notification service
