# Fase 3 - Carrito

## Qué

Implementar el carrito de compras completo: agregar/remover/actualizar productos, soporte para productos especiales (V-Bucks, Crew, Battle Pass) con modal de captura de credenciales Epic encriptadas (AES-256-GCM), persistencia en base de datos por usuario autenticado, y validación de productos contra el catálogo activo.

## Por Qué

El carrito es el paso previo al sistema de solicitudes (Fase 4). Los productos especiales requieren credenciales del usuario para poder ser regalados, y estas deben almacenarse de forma segura y nunca en texto plano.

## Alcance

### In-scope
- `POST /api/cart` — agregar producto (con validación de existencia y giftable)
- `PATCH /api/cart/[itemId]` — actualizar cantidad o credenciales
- `DELETE /api/cart/[itemId]` — remover item
- `GET /api/cart` — listar items del usuario con datos del producto (join snapshot)
- Modal de credenciales para tipos VBucks, CREW, BATTLE_PASS (email + contraseña Epic)
- Encriptación AES-256-GCM con `ENCRYPTION_KEY` (nunca texto plano)
- Persistencia en DB (tabla `cart_items` ya existe en schema)
- Sincronización localStorage → DB al iniciar sesión
- Validación: producto existe, está activo en catálogo, es giftable si type=GIFT
- Cantidad mínima 1, máxima 10
- Un solo tipo de producto especial por usuario (`@@unique([user_id, product_id])`)
- UI: página `/cart`, botón "Agregar al carrito" en ProductCard, badge contador en header
- Hook `useCart` con contexto global

### Non-goals
- No implementar generación de Request ni mensaje WhatsApp (Fase 4)
- No implementar checkout ni pagos (MVP manual)
- No implementar carrito para usuarios anónimos (requiere login)
- No implementar cupones ni descuentos
- No desencriptar credenciales en el frontend (solo el vendedor las verá en admin)

## Specs afectadas

- `cart` — Nuevos requerimientos de gestión de carrito, credenciales seguras, validación

## Criterios de éxito

1. Usuario autenticado puede agregar/remover/actualizar productos del carrito
2. Productos especiales piden credenciales vía modal antes de agregarse
3. Credenciales se almacenan encriptadas (AES-256-GCM) en `encrypted_credentials`
4. Credenciales jamás se devuelven al frontend (ni en GET /api/cart)
5. Producto inexistente o inactivo es rechazado con error claro
6. Cantidad limitada a 1-10
7. Carrito persiste entre sesiones (DB)
8. Contador de items visible en el header
9. `npm run typecheck` pasa sin errores
10. `npm run lint` pasa sin errores
11. Tests unitarios de cart-service y crypto pasan

## Estimación

- **Duración**: 2-3 horas
- **Complejidad**: Media
- **Riesgo**: Medio (manejo seguro de credenciales)
