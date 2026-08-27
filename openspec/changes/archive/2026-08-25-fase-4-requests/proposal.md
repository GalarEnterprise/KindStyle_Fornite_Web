# Fase 4 - Sistema de Solicitudes (Requests)

## Qué

Implementar el flujo completo de solicitudes de compra: convertir el carrito en un Request con items snapshotteados, generar Request Number único (`REQ-YYYYMMDD-XXXX`), construir el mensaje para el vendedor, abrir WhatsApp con mensaje prellenado (`wa.me`), permitir copiar la solicitud, registrar la apertura de WhatsApp (`whatsapp_opened_at`) y listar las solicitudes del cliente.

## Por Qué

El MVP no tiene pasarela de pago: la venta se cierra por WhatsApp con el vendedor. El Request es la unidad central del negocio (estados, pagos, fulfillment, métricas) y es el paso que convierte interés en conversación de venta.

## Alcance

### In-scope
- `POST /api/requests` — crear Request desde el carrito del usuario autenticado:
  - Valida carrito no vacío y productos activos
  - Snapshot de nombre, SKU, precio V-Bucks y offer ID por item (tabla `request_items`)
  - Calcula totales (`total_vbucks`, `total_mxn` con tasa configurable)
  - Vacía el carrito al crear el Request (transacción)
- Generación de Request Number: `REQ-YYYYMMDD-XXXX` secuencial por día, único, con reintento ante colisión
- Generador de mensaje para el vendedor: número de solicitud, apodo del cliente, items con cantidades, totales
- `POST /api/requests/[id]/whatsapp-opened` — registra `whatsapp_opened_at` (solo primera vez) y cambia estado a `WHATSAPP_OPENED`
- URL `wa.me/+523191033181` con mensaje codificado (número desde `NEXT_PUBLIC_WHATSAPP_NUMBER`)
- Botón "Copiar solicitud" (clipboard) con feedback visual
- `GET /api/requests` — lista solicitudes propias; `GET /api/requests/[id]` — detalle propio
- UI: página `/checkout` que muestra la solicitud generada (WhatsApp + copiar), página `/account/requests` con historial
- Habilitar CTA "Solicitar productos" en el carrito (hoy deshabilitado)

### Non-goals
- No implementar pagos ni validación de comprobantes (Fase 7)
- No implementar panel admin de solicitudes (Fase 9)
- No implementar notificaciones email/push (Fase 8)
- No implementar verificación automática de bots/amistades para solicitar (el usuario puede pedir sin bots preparados)
- No asumir que `whatsapp_opened` = mensaje enviado (eventos distintos)

## Specs afectadas

- `requests` — Nuevos requerimientos de creación, numeración, mensaje WhatsApp, tracking y consulta

## Criterios de éxito

1. Usuario con carrito puede generar una solicitud y queda registrada con sus items snapshotteados
2. El carrito se vacía tras crear la solicitud
3. Request Number único con formato `REQ-YYYYMMDD-XXXX`
4. Mensaje de WhatsApp contiene datos completos y abre `wa.me` correcto
5. Apertura de WhatsApp registra timestamp solo una vez y mueve estado a WHATSAPP_OPENED
6. Usuario ve su historial de solicitudes con estados
7. Otro usuario no puede ver ni modificar solicitudes ajenas (404)
8. `npm run typecheck` pasa sin errores
9. `npm run lint` pasa sin errores
10. Tests de request-service y validadores pasan

## Estimación

- **Duración**: 3-4 horas
- **Complejidad**: Media
- **Riesgo**: Bajo-Medio (concurrencia de numeración, transacciones)
