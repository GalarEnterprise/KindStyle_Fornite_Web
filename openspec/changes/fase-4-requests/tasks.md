# Fase 4 - Requests — Tareas de Implementación

## Tarea 1: Validators de Requests

**Objetivo**: Schemas Zod para creación y tracking.

**Archivos a crear**:
- `apps/web/src/lib/validators/requests.ts`

**Criterios de aceptación**:
- [x] Schema `CreateRequestSchema` (sin campos requeridos por ahora; reservado para nota del cliente opcional)
- [x] Schema `WhatsAppOpenedSchema` (id uuid en params)
- [x] Tipos inferidos exportados
- [x] Test: validación básica

**Estimación**: 20 minutos

---

## Tarea 2: Servicio de Requests

**Objetivo**: Lógica de negocio: crear solicitud desde carrito, numeración, consultas.

**Archivos a crear**:
- `apps/web/src/lib/services/requests/request-service.ts`

**Criterios de aceptación**:
- [x] Función `createRequestFromCart(userId)` → transacción: valida carrito, snapshot items, totales, vacía carrito
- [x] Función `generateRequestNumber(tx, date)` → `REQ-YYYYMMDD-XXXX` con retry ante colisión (máx 5)
- [x] Función `getUserRequests(userId)` → lista con estado, orden descendente
- [x] Función `getRequestById(userId, requestId)` → detalle con items; null si ajeno/inexistente
- [x] Función `markWhatsappOpened(userId, requestId)` → idempotente, CREATED→WHATSAPP_OPENED
- [x] Totales calculados con tasa de `CurrencySetting` (fallback 7.5/100)
- [x] Carrito vacío → error 409 tipado; producto inactivo → 400
- [x] Test: creación desde carrito mockeado, snapshots correctos, numeración, idempotencia

**Estimación**: 1.5 horas

---

## Tarea 3: Generador de Mensaje WhatsApp

**Objetivo**: Construcción del mensaje y URL wa.me.

**Archivos a crear**:
- `apps/web/src/lib/services/requests/message-service.ts`

**Criterios de aceptación**:
- [x] Función `buildRequestMessage(request)` → texto plano con solicitud, cliente, items, totales
- [x] Función `buildWhatsappUrl(message)` → `https://wa.me/<numero>?text=<encoded>` usando `NEXT_PUBLIC_WHATSAPP_NUMBER`
- [x] Sin credenciales ni datos sensibles en el mensaje
- [x] Test: formato del mensaje y URL encoding

**Estimación**: 45 minutos

---

## Tarea 4: API Routes de Requests

**Objetivo**: Endpoints REST protegidos por auth.

**Archivos a crear**:
- `apps/web/src/app/api/requests/route.ts` (GET, POST)
- `apps/web/src/app/api/requests/[id]/route.ts` (GET)
- `apps/web/src/app/api/requests/[id]/whatsapp-opened/route.ts` (POST)

**Criterios de aceptación**:
- [x] Todas las rutas requieren autenticación (401 JSON si no)
- [x] Solicitudes ajenas responden 404
- [x] Respuestas consistentes `{ success, data, error }`
- [x] POST /api/requests devuelve request + mensaje + whatsappUrl listos para la UI
- [x] Errores tipados: 400, 401, 404, 409
- [x] Test: rutas protegen y responden correctamente

**Estimación**: 1 hora

---

## Tarea 5: Página de Checkout (confirmación)

**Objetivo**: Vista post-creación con WhatsApp y copiar.

**Archivos a crear**:
- `apps/web/src/app/account/checkout/page.tsx`
- `apps/web/src/components/requests/request-confirmation.tsx`

**Criterios de aceptación**:
- [x] Muestra número de solicitud, items, totales y estado actual
- [x] Botón "Abrir WhatsApp": registra tracking ANTES de abrir wa.me (window.open)
- [x] Botón "Copiar solicitud": clipboard + feedback visual "✓ Copiado"
- [x] Estados de carga y error
- [x] Responsive

**Estimación**: 1 hora

---

## Tarea 6: Historial de Solicitudes

**Objetivo**: Lista de solicitudes del usuario.

**Archivos a modificar**:
- `apps/web/src/app/account/requests/page.tsx`

**Archivos a crear**:
- `apps/web/src/components/requests/request-list.tsx`
- `apps/web/src/hooks/use-requests.ts`

**Criterios de aceptación**:
- [x] Hook `useRequests()` → lista + refresh
- [x] Lista ordenada descendente con número, fecha, total y badge de estado
- [x] Click lleva al detalle/checkout de la solicitud
- [x] Estado vacío con CTA a la tienda
- [x] Responsive

**Estimación**: 1 hora

---

## Tarea 7: Habilitar CTA en el Carrito

**Objetivo**: Conectar el botón "Solicitar productos" del carrito.

**Archivos a modificar**:
- `apps/web/src/components/cart/cart-view.tsx`

**Criterios de aceptación**:
- [x] CTA habilitado cuando hay items
- [x] Al pulsar: POST /api/requests → redirect a `/account/checkout?request=<id>`
- [x] Error carrito vacío (409) manejado con mensaje claro
- [x] Loading state durante la creación

**Estimación**: 30 minutos

---

## Tarea 8: Tests de Integración

**Objetivo**: Cobertura del flujo de solicitudes.

**Archivos a crear**:
- `apps/web/src/__tests__/requests/request-service.test.ts`
- `apps/web/src/__tests__/requests/message.test.ts`

**Criterios de aceptación**:
- [x] Test: crear solicitud desde carrito (snapshots, totales, carrito vaciado)
- [x] Test: carrito vacío rechaza con 409
- [x] Test: numeración única y formato REQ-YYYYMMDD-XXXX
- [x] Test: markWhatsappOpened idempotente
- [x] Test: mensaje sin datos sensibles y URL bien codificada
- [x] Coverage >80% en request-service y message-service

**Estimación**: 1.5 horas

---

## Resumen

| # | Tarea | Estimación | Dependencias |
|---|-------|-----------|--------------|
| 1 | Validators | 0.33h | — |
| 2 | Request Service | 1.5h | 1 |
| 3 | Message Service | 0.75h | — |
| 4 | API Routes | 1h | 2, 3 |
| 5 | Checkout UI | 1h | 4 |
| 6 | Historial | 1h | 4 |
| 7 | CTA Carrito | 0.5h | 4 |
| 8 | Tests | 1.5h | 2-4 |

**Tiempo total estimado**: ~7.5 horas

**Orden recomendado**: 1 → 3 → 2 → 4 → 8 (parcial) → 5 → 6 → 7 → 8 (final)

### Supuestos registrados
- Nombre del change: `fase-4-requests` (plural, según PHASES.md) aunque se invocó como `fase-4-request`
- `XXXX` del Request Number es secuencial diario con padding a 4 dígitos (PHASES.md no especifica semántica)
