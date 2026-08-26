# Delta Spec: cart

## ADDED Requirements

### REQ-CART-001: Agregar producto al carrito

El sistema DEBE permitir a un usuario autenticado agregar un producto del catálogo activo a su carrito mediante `POST /api/cart`.

- El endpoint DEBE requerir autenticación válida (401 si no).
- DEBE rechazar productos inexistentes (404) o inactivos (400).
- Si el producto ya está en el carrito, DEBE incrementar la cantidad (máx. 10).
- DEBE aceptar cantidad entre 1 y 10; fuera de rango DEBE devolver 422.

### REQ-CART-002: Productos especiales con credenciales

Los productos de tipo VBucks, CREW o BATTLE_PASS DEBEN capturar credenciales Epic (email + contraseña) antes de agregarse.

- El sistema DEBE mostrar un modal de credenciales cuando el tipo lo requiera.
- DEBE rechazar el alta de un producto especial sin credenciales completas (422).
- Los productos GIFT NO DEBEN solicitar credenciales.

### REQ-CART-003: Encriptación de credenciales

Las credenciales DEBEN almacenarse encriptadas con AES-256-GCM usando `ENCRYPTION_KEY`, en el campo `encrypted_credentials` de `cart_items`.

- NUNCA DEBEN persistirse en texto plano.
- Cada cifrado DEBE usar un IV aleatorio único.
- La key DEBE derivarse con scrypt a 32 bytes.

### REQ-CART-004: Credenciales nunca visibles al cliente

El sistema NO DEBE devolver `encrypted_credentials` ni credenciales desencriptadas en ninguna respuesta pública (`GET /api/cart` incluido).

- Las respuestas DEBEN seleccionar columnas explícitamente excluyendo ese campo.

### REQ-CART-005: Actualizar item

El sistema DEBE permitir actualizar cantidad o reemplazar credenciales de un item propio mediante `PATCH /api/cart/[itemId]`.

- DEBE responder 403/404 si el item pertenece a otro usuario.
- Cantidad DEBE respetar el rango 1-10.

### REQ-CART-006: Remover item

El sistema DEBE permitir remover un item propio mediante `DELETE /api/cart/[itemId]`.

- DEBE responder 404 si el item no existe o no es del usuario.

### REQ-CART-007: Listar carrito

El sistema DEBE listar los items del usuario autenticado mediante `GET /api/cart`, incluyendo datos actuales del producto (nombre, precio MXN/V-Bucks, imagen, giftable) tomados del snapshot de catálogo.

- Los items DEBEN ordenarse por fecha de creación ascendente.
- El carrito vacío DEBE devolver lista vacía con éxito (200).

### REQ-CART-008: Persistencia

El carrito DEBE persistir en PostgreSQL por usuario y sobrevivir sesiones/dispositivos.

- El frontend PUEDE usar localStorage como caché de lectura para el badge del header.
- La fuente de verdad SIEMPRE es la base de datos.

### REQ-CART-009: UI de carrito

El sistema DEBE proveer página `/cart` que muestre: producto, precio, cantidad, tipo y si es giftable; con acciones de remover y actualizar cantidad.

- El header DEBE mostrar contador de items del carrito.
- El botón "Agregar al carrito" DEBE reflejar estado de carga y éxito.
