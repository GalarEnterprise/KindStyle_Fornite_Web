# Sistema de Notificaciones

## Canales

- **WEB**: Campanita en header, dropdown con lista
- **EMAIL**: Resend
- **WHATSAPP**: wa.me con mensaje prellenado (por ahora)

## Eventos que Generan Notificación

### Para el Cliente

| Evento | Web | Email | WhatsApp |
|--------|-----|-------|----------|
| Solicitud de amistad creada | ✓ | ✓ | - |
| Solicitud de amistad enviada por bot | ✓ | - | - |
| Amistad confirmada | ✓ | ✓ | - |
| Timer iniciado | ✓ | ✓ | ✓ |
| Timer completado (elegible) | ✓ | ✓ | ✓ |
| Nuevo bot disponible | ✓ | ✓ | - |
| Pedido creado | ✓ | ✓ | - |
| Pago validado | ✓ | ✓ | ✓ |
| Pago rechazado | ✓ | ✓ | ✓ |
| Pedido listo para fulfillment | ✓ | ✓ | ✓ |
| Pedido completado | ✓ | ✓ | ✓ |

### Para el Admin

| Evento | Web | Email |
|--------|-----|-------|
| Nuevo pedido | ✓ | ✓ |
| Comprobante subido | ✓ | ✓ |
| Cliente aceptó amistad | ✓ | - |

## Notificaciones Web

### UI
- Icono de campanita en header
- Badge con número de no leídas
- Dropdown al hacer clic con lista
- Marcar como leída al hacer clic
- "Marcar todas como leídas"

### Estructura
```
🔔 Notificaciones (3)

─────────────────
🟢 Bot preparado
Hace 2 horas
Bot KindStyle 1 ya está agregado. Timer iniciado.
─────────────────
💰 Pago confirmado
Hace 5 horas
Tu pedido REQ-20260823-8F42 ha sido validado.
─────────────────
🎁 Nuevo bot disponible
Ayer
Puedes solicitar un nuevo bot para acelerar tu servicio.
```

## Estructura DB

### notifications
```
id, user_id,
type, channel,
title, message, metadata,
read_at,
created_at
```

### notification_preferences
```
id, user_id,
email_enabled, web_enabled, whatsapp_enabled,
updated_at
```

## Servicio

```typescript
interface NotificationService {
  send(event: NotificationEvent, userId: string): Promise<void>
  sendToAdmin(event: NotificationEvent): Promise<void>
  markAsRead(notificationId: string): Promise<void>
  getUnreadCount(userId: string): Promise<number>
}
```

## Templates

Cada tipo de notificación tiene template específico para cada canal.

Ejemplo - Timer iniciado:

**Web:**
```
🟢 Bot preparado
El Bot {bot_name} ya está agregado a tu cuenta.
Tu período de espera ha comenzado.
Fecha de disponibilidad: {eligibility_date}
Tiempo restante: {remaining_time}
```

**Email:**
```
Asunto: Tu bot ya está listo - KindStyle

Hola {user_name},

Tu bot {bot_name} ya ha sido agregado a tu cuenta de Fortnite.

El período de espera ha comenzado:
📅 Fecha de disponibilidad: {eligibility_date}
⏱ Tiempo restante: {remaining_time}

Puedes ver el estado en tu panel: {link}

- Equipo KindStyle
```

**WhatsApp:**
```
🟢 Bot preparado

El Bot {bot_name} ya está agregado a tu cuenta.

Fecha de disponibilidad: {eligibility_date}
Tiempo restante: {remaining_time}

Ver estado: {link}
```
