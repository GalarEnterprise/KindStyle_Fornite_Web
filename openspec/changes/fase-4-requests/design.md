# Fase 4 - Requests — Diseño

## Flujo general

```text
/carrito  [SOLICITAR PRODUCTOS]
        │ POST /api/requests
        ▼
request-service.createRequestFromCart(userId)
        │
        ├─ 1. Lee cart_items del usuario (409 si vacío)
        ├─ 2. Valida productos activos/visibles
        ├─ 3. BEGIN TRANSACTION
        │      ├─ Crea Request (status CREATED, totales)
        │      ├─ Crea RequestItems (snapshots)
        │      └─ Borra cart_items
        │    COMMIT
        ▼
/checkout?request=<id>
        │
        ├── [ABRIR WHATSAPP] → POST /whatsapp-opened + window.open(wa.me)
        └── [COPIAR SOLICITUD] → clipboard.writeText(mensaje)
```

## Decisiones de diseño

### 1. Numeración `REQ-YYYYMMDD-XXXX` secuencial por día

**Opción elegida**: contador diario derivado de la DB: contar requests existentes de la fecha y sumar 1, con reintento (máx. 5) si hay colisión de unique constraint.

```text
REQ = "REQ-" + YYYYMMDD + "-" + pad(seq, 4)   // REQ-20260825-0001
```

**Alternativas descartadas**:
- UUID/nanoid: no legible para el vendedor en WhatsApp
- Secuencia global en Redis: acopla numeración a infraestructura cache; reinicio de Redis perdería el conteo

**Trade-off**: bajo el peor caso concurrente, dos requests podrían intentar el mismo número; el retry sobre la violación de unique lo resuelve. Aceptable para el volumen MVP.

### 2. Snapshots inmutables en RequestItem

El precio y nombre se copian a `request_items` en el momento de crear la solicitud (`product_name_snapshot`, `price_vbucks_snapshot`, `sku`, `fortnite_offer_id`). Cambios posteriores del catálogo NUNCA alteran una solicitud existente: es la referencia económica para pagos (Fase 7).

### 3. Totales con tasa configurable

`total_mxn` usa la tasa V-Bucks→MXN de la tabla `CurrencySetting` (default 7.5 / 100 V-Bucks). Si no existe configuración, caer al default hardcodeado como último recurso (no debe pasar en producción porque el seed lo crea).

### 4. Transacción carrito → request

Leer carrito, validar, crear request+items y vaciar carrito ocurren en una sola transacción Prisma (`$transaction`). Evita solicitudes vacías o carritos duplicados si el usuario hace doble clic: el segundo POST encuentra carrito vacío → 409.

### 5. Tracking de WhatsApp

`POST /api/requests/[id]/whatsapp-opened`:
- Si `whatsapp_opened_at` ya está seteado → responde éxito sin cambiar nada (idempotente)
- Si no → setea timestamp y mueve `status` CREATED → WHATSAPP_OPENED
- El frontend abre `wa.me` SOLO después de que el tracking responda (evita perder el evento si el usuario cancela la navegación)

Estados tocados en esta fase: solo `CREATED` y `WHATSAPP_OPENED`. El resto del ciclo (CONTACTED, PAID...) lo operará el admin en fases posteriores.

### 6. Mensaje para el vendedor

Texto plano plano y corto (WhatsApp), sin markdown:

```text
Nueva solicitud KindStyle
Solicitud: REQ-20260825-0001
Cliente: <nickname>

Productos:
- Renegade Raider x1 (1200 V-Bucks)
- 1000 V-Bucks x2 (2000 V-Bucks)

Total: 3200 V-Bucks (~240.00 MXN)
```

El número de WhatsApp se toma de `NEXT_PUBLIC_WHATSAPP_NUMBER`; el mensaje viaja URL-encoded en `https://wa.me/<numero>?text=<mensaje>`.

### 7. Autorización por dueño

Todas las rutas filtran por `user_id` del JWT; un request ajeno devuelve 404 (no 403, para no filtrar existencia).
