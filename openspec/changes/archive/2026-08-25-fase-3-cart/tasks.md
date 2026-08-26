# Fase 3 - Carrito — Tareas de Implementación

## Tarea 1: Servicio de Encriptación

**Objetivo**: Cifrado/descifrado AES-256-GCM para credenciales Epic.

**Archivos a crear**:
- `apps/web/src/lib/services/cart/crypto-service.ts`

**Criterios de aceptación**:
- [x] Función `encryptCredentials(plain)` → `{ iv, tag, data }` base64
- [x] Función `decryptCredentials(encrypted)` → string plano
- [x] Key derivada con `scrypt` desde `ENCRYPTION_KEY` (32 bytes)
- [x] IV aleatorio de 12 bytes por operación
- [x] Error claro si `ENCRYPTION_KEY` no está definida
- [x] Test: roundtrip cifrar→descifrar, IVs distintos, dato corrupto falla

**Estimación**: 45 minutos

---

## Tarea 2: Validators de Carrito

**Objetivo**: Schemas Zod para inputs del carrito.

**Archivos a crear**:
- `apps/web/src/lib/validators/cart.ts`

**Criterios de aceptación**:
- [x] Schema `AddToCartSchema` (productId uuid, quantity int 1-10 default 1, credentials opcional)
- [x] Schema `UpdateCartItemSchema` (quantity opcional 1-10, credentials opcional)
- [x] Validación condicional: tipo especial requiere credentials completas (email + contraseña)
- [x] Tipos inferidos exportados
- [x] Test: datos válidos e inválidos

**Estimación**: 30 minutos

---

## Tarea 3: Servicio de Carrito

**Objetivo**: Lógica de negocio del carrito sobre tabla `cart_items`.

**Archivos a crear**:
- `apps/web/src/lib/services/cart/cart-service.ts`

**Criterios de aceptación**:
- [x] Función `getCart(userId)` → items con snapshot de producto (SIN encrypted_credentials)
- [x] Función `addItem(userId, input)` → valida producto activo/giftable, upsert con incremento
- [x] Función `updateItem(userId, itemId, input)` → cantidad y/o re-cifrado de credenciales
- [x] Función `removeItem(userId, itemId)` → delete con verificación de dueño
- [x] Función `clearCart(userId)` → vaciar carrito
- [x] Productos especiales sin credenciales rechazados (422)
- [x] Producto inexistente/inactivo rechazado (404/400)
- [x] Test: agregar, duplicar incrementa, actualizar, remover, validar producto

**Estimación**: 1.5 horas

---

## Tarea 4: API Routes de Carrito

**Objetivo**: Endpoints REST protegidos por auth.

**Archivos a crear**:
- `apps/web/src/app/api/cart/route.ts` (GET, POST)
- `apps/web/src/app/api/cart/[itemId]/route.ts` (PATCH, DELETE)

**Criterios de aceptación**:
- [x] Todas las rutas usan `requireAuth`
- [x] Respuestas consistentes `{ success, data, error }`
- [x] GET nunca incluye `encrypted_credentials`
- [x] Errores tipados: 401, 400, 404, 422
- [x] Test: rutas protegen y responden correctamente

**Estimación**: 1 hora

---

## Tarea 5: Hook useCart

**Objetivo**: Estado global del carrito en el cliente.

**Archivos a crear**:
- `apps/web/src/hooks/use-cart.tsx`

**Criterios de aceptación**:
- [x] Provider + hook `useCart()` → `{ items, count, isLoading, addItem, updateItem, removeItem }`
- [x] Sincroniza con `GET /api/cart` al montar (si autenticado)
- [x] Cache en localStorage para badge instantáneo
- [x] Refresca contador tras cada mutación
- [x] Test: hook expone estado correcto

**Estimación**: 1 hora

---

## Tarea 6: Modal de Credenciales

**Objetivo**: Captura segura de credenciales Epic para productos especiales.

**Archivos a crear**:
- `apps/web/src/components/cart/credentials-modal.tsx`

**Criterios de aceptación**:
- [x] Modal con email + contraseña Epic (inputs password)
- [x] Solo aparece para tipos VBucks, CREW, BATTLE_PASS
- [x] Validación client-side antes de enviar
- [x] No persiste credenciales en localStorage
- [x] Estados: loading, error, cancelar

**Estimación**: 1 hora

---

## Tarea 7: Botón Agregar al Carrito + Badge Header

**Objetivo**: Integración del carrito en catálogo y navegación.

**Archivos a modificar**:
- `apps/web/src/components/shop/product-card.tsx`
- Header existente (layout público)

**Archivos a crear**:
- `apps/web/src/components/cart/cart-badge.tsx`

**Criterios de aceptación**:
- [x] ProductCard tiene botón "Agregar al carrito" funcional
- [x] Si no autenticado → redirige a `/login`
- [x] Badge muestra total de items en header
- [x] Feedback visual al agregar (check breve)
- [x] Responsive

**Estimación**: 1 hora

---

## Tarea 8: Página /cart

**Objetivo**: Vista completa del carrito.

**Archivos a crear**:
- `apps/web/src/app/(public)/cart/page.tsx`
- `apps/web/src/components/cart/cart-view.tsx`

**Criterios de aceptación**:
- [x] Muestra: imagen, nombre, precio MXN/V-Bucks, cantidad, tipo, giftable
- [x] Acciones: cambiar cantidad (+/-), remover item
- [x] Estado vacío con CTA a la tienda
- [x] Total acumulado visible
- [x] Placeholder "Solicitar productos" deshabilitado (Fase 4)
- [x] Responsive

**Estimación**: 1.5 horas

---

## Tarea 9: Tests de Integración

**Objetivo**: Cobertura del flujo completo del carrito.

**Archivos a crear**:
- `apps/web/src/__tests__/cart/cart-service.test.ts`
- `apps/web/src/__tests__/cart/api-routes.test.ts`

**Criterios de aceptación**:
- [x] Test: roundtrip de encriptación
- [x] Test: agregar producto normal y especial
- [x] Test: especial sin credenciales falla
- [x] Test: cantidad fuera de rango falla
- [x] Test: usuario no puede tocar items ajenos
- [x] Test: GET nunca devuelve credenciales
- [x] Coverage >80% en crypto-service y cart-service

**Estimación**: 1.5 horas

---

## Resumen

| # | Tarea | Estimación | Dependencias |
|---|-------|-----------|--------------|
| 1 | Crypto Service | 0.75h | — |
| 2 | Validators | 0.5h | — |
| 3 | Cart Service | 1.5h | 1, 2 |
| 4 | API Routes | 1h | 3 |
| 5 | Hook useCart | 1h | 4 |
| 6 | Credentials Modal | 1h | 5 |
| 7 | Botón + Badge | 1h | 5 |
| 8 | Página /cart | 1.5h | 5 |
| 9 | Tests | 1.5h | 1-4 |

**Tiempo total estimado**: ~9.75 horas

**Orden recomendado**: 1 → 2 → 3 → 4 → 9 (parcial) → 5 → 6 → 7 → 8 → 9 (final)
