# Delta Spec: requests

## ADDED Requirements

### REQ-REQ-001: Crear solicitud desde el carrito

El sistema DEBE permitir a un usuario autenticado crear una solicitud (Request) a partir de su carrito mediante `POST /api/requests`.

- DEBE rechazar la creación si el carrito está vacío (409).
- DEBE rechazar productos inactivos o inexistentes en el momento de crear (400).
- DEBE operar en una transacción: creación de Request + RequestItems + vaciado del carrito.
- DEBE requerir nickname configurado para poder solicitar.

### REQ-REQ-002: Snapshot de items

Al crear la solicitud, el sistema DEBE copiar por cada item: nombre del producto, SKU, `fortnite_product_id`, `fortnite_offer_id` y precio V-Bucks en los campos snapshot de `request_items`.

- Los snapshots NO DEBEN actualizarse si el catálogo cambia después.
- La cantidad DEBE copiarse del carrito.

### REQ-REQ-003: Totales de la solicitud

El sistema DEBE calcular y persistir `total_vbucks` y `total_mxn` del request.

- `total_mxn` DEBE usar la tasa V-Bucks→MXN de `CurrencySetting`.
- Los totales DEBEN ser consistentes con la suma de los items snapshotteados.

### REQ-REQ-004: Request Number único

El sistema DEBE generar un número de solicitud con formato `REQ-YYYYMMDD-XXXX`, secuencial por día y único globalmente.

- Ante colisión, DEBE reintentar la generación en lugar de fallar.
- El campo `request_number` DEBE tener constraint único en DB.

### REQ-REQ-005: Vaciar carrito al solicitar

Tras crear exitosamente la solicitud, el sistema DEBE eliminar todos los items del carrito del usuario dentro de la misma transacción.

- Si la creación falla, el carrito DEBE permanecer intacto.

### REQ-REQ-006: Mensaje para WhatsApp

El sistema DEBE generar un mensaje de texto plano que incluya: número de solicitud, apodo del cliente, lista de productos con cantidades y precios V-Bucks, y total estimado en MXN.

- El mensaje NO DEBE incluir credenciales Epic ni datos sensibles.
- El mensaje DEBE estar disponible tanto para copiar como para la URL de WhatsApp.

### REQ-REQ-007: Apertura de WhatsApp

El sistema DEBE proveer `POST /api/requests/[id]/whatsapp-opened` que registre `whatsapp_opened_at` y mueva el estado CREATED → WHATSAPP_OPENED.

- DEBE ser idempotente: si ya existe `whatsapp_opened_at`, no modificar nada.
- La URL DEBE usar `wa.me` con el número de `NEXT_PUBLIC_WHATSAPP_NUMBER` y el mensaje URL-encoded.
- El registro de apertura NO DEBE asumirse como confirmación de envío del mensaje.

### REQ-REQ-008: Consultar solicitudes propias

El sistema DEBE permitir al usuario listar sus solicitudes (`GET /api/requests`) y ver el detalle de una propia (`GET /api/requests/[id]`), incluyendo estado e items.

- Las solicitudes de otros usuarios DEBEN responder 404.
- La lista DEBE ordenarse por fecha de creación descendente.

### REQ-REQ-009: UI de checkout e historial

El sistema DEBE mostrar tras crear la solicitud una vista de confirmación con: número de solicitud, resumen de items, botón "Abrir WhatsApp" y botón "Copiar solicitud" con feedback visual.

- El CTA "Solicitar productos" del carrito DEBE quedar habilitado cuando hay items.
- El sistema DEBE mostrar el historial de solicitudes en `/account/requests` con su estado visible.
