# Sistema de Solicitudes (Requests)

## Request ID

Formato: `REQ-YYYYMMDD-XXXX`
Ejemplo: `REQ-20260823-8F42`

Único, aparece en:
- Cliente (panel)
- Admin
- WhatsApp
- Email
- Notificaciones
- Soporte

## Flujo de Generación

```
Carrito → "SOLICITAR PRODUCTOS"
    ↓
Backend:
1. Validar productos
2. Obtener snapshots actuales
3. Crear Request
4. Crear Request Items
5. Generar Request Number
6. Generar mensaje formateado
7. Devolver WhatsApp URL + texto para copiar
```

## Mensaje Generado

```
Hola 👋

Quiero solicitar los siguientes productos:

🎁 REGALOS
• Spider-Man — 1,500 V-Bucks
• Batman Pack — 2,500 V-Bucks

💰 RECARGA
• 4,500 V-Bucks

🎮 Datos de mi cuenta
Plataforma: Epic Games
ID: Pablito123

🆔 Solicitud:
REQ-20260823-8F42

Quedo atento a la confirmación de disponibilidad
y precio final.
```

## Acciones del Cliente

1. **COPIAR SOLICITUD**: Copia texto al portapapeles
   - Feedback: "✓ Solicitud copiada"

2. **ABRIR WHATSAPP**: wa.me con mensaje prellenado
   - Registrar: `whatsapp_opened_at`
   - NO asumir que whatsapp_opened = mensaje enviado

## Estados de Request

```
CREATED
WHATSAPP_OPENED
CONTACTED
UNDER_REVIEW
PRICE_CONFIRMED
PAYMENT_PENDING
PAID
FULFILLMENT_PENDING
FULFILLED
CANCELLED
EXPIRED
```

## Estructura DB

### requests
```
id, request_number, user_id, status, channel, message,
created_at, updated_at
```

### request_items
```
id, request_id, product_id, sku, product_name_snapshot,
fortnite_product_id, fortnite_offer_id, price_vbucks_snapshot,
quantity, fulfillment_type, created_at
```

## Admin - Panel de Requests

Ruta: `/admin/requests`

Orden: `created_at DESC` (nuevas primero)

Filtros: NEW, CONTACTED, UNDER_REVIEW, PAYMENT_PENDING, PAID, FULFILLMENT_PENDING, FULFILLED, CANCELLED

Datos visibles:
- Request ID
- Cliente (nombre/email)
- WhatsApp
- Fortnite ID
- Plataforma
- Productos
- Tipo de producto
- Fecha de solicitud
- Estado
- Friendship Request asociada
- Botón [COPIAR ID]
