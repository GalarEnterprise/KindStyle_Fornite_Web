# Sistema de Carrito

## Funcionalidades

- Agregar productos
- Remover productos
- Actualizar cantidad
- Persistencia (localStorage + DB si autenticado)
- Validación de productos contra catálogo actual

## Flujo

```
Producto en tienda
    ↓
Click "Agregar al carrito"
    ↓
¿Es V-Bucks/Crew/Battle Pass?
    ├─ SÍ → Modal pide email + contraseña Epic
    │        ↓
    │    Encriptar credenciales
    │        ↓
    │    Agregar al carrito con credenciales
    │
    └─ NO → Agregar normalmente
    ↓
Carrito actualizado
    ↓
Ir a checkout
```

## Estructura del Carrito

```typescript
interface CartItem {
  productId: string
  quantity: number
  priceVbucks: number
  priceCurrency: number
  type: 'gift' | 'vbucks' | 'crew' | 'battlepass' | 'bundle'
  // Solo para vbucks/crew/battlepass:
  epicCredentials?: {
    email: string      // encriptado
    password: string   // encriptado
  }
  // Solo para bundles:
  bundleOfferId?: string
  bundleName?: string
  bundlePriceVbucks?: number
  bundleComponents?: { productId: string; name: string; slug: string }[]
}
```

## Reglas

- No mezclar productos que requieren credenciales con los que no
- Validar que el producto siga disponible antes de checkout
- Si el catálogo cambió (precio, disponibilidad), notificar al usuario
- Carrito persistente para usuarios autenticados
- Carrito temporal (localStorage) para invitados

## Visualización

- Lista de productos con:
  - Icono
  - Nombre
  - V-Bucks
  - Precio en moneda seleccionada
  - Cantidad
  - Botón eliminar
- Total en V-Bucks
- Total en moneda seleccionada
- Botón "Proceder al pago"

## Requerimientos


El sistema DEBE permitir a un usuario autenticado agregar un producto del catálogo activo a su carrito mediante `POST /api/cart`.

- El endpoint DEBE requerir autenticación válida (401 si no).
- DEBE rechazar productos inexistentes (404) o inactivos (400).
- Si el producto ya está en el carrito, DEBE incrementar la cantidad (máx. 10).
- DEBE aceptar cantidad entre 1 y 10; fuera de rango DEBE devolver 422.

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

### REQ-CART-010: Agregar bundle al carrito

El sistema DEBE permitir agregar un bundle (paquete completo de la API Fortnite) al carrito mediante `POST /api/cart` usando `offerId` como identificador.

- El endpoint DEBE requerir autenticación válida (401 si no).
- DEBE validar que exista un `ShopItem` activo con ese `offer_id` en el último snapshot (404 si no).
- DEBE crear un `CartItem` con `type: 'BUNDLE'` y precio V-Bucks igual al `finalPrice` fijo del snapshot de la API (NO se suma ni se prorratean los componentes).
- DEBE aceptar `quantity` entre 1 y 10 (default 1); fuera de rango DEBE devolver 422.
- Si el bundle ya está en el carrito, DEBE incrementar la cantidad (máx. 10).
- DEBE rechazar un cuerpo que envíe `productId` y `offerId` a la vez (422).

#### Scenario: Agregar bundle válido
- **WHEN** un usuario autenticado envía `POST /api/cart` con `{ offerId: "v2:/...", quantity: 1 }`
- **THEN** el sistema crea un `CartItem` tipo `BUNDLE` con precio 2500 V-Bucks (el `finalPrice` de la API) y responde 201 con `{ success: true, data: { id, quantity } }`

#### Scenario: Bundle inexistente
- **WHEN** el `offerId` no corresponde a ningún `ShopItem` vigente en el último snapshot
- **THEN** el sistema responde 404 con `PRODUCT_NOT_FOUND`

#### Scenario: Cantidad fuera de rango
- **WHEN** `quantity` es 0 o mayor a 10
- **THEN** el sistema responde 422 con `VALIDATION_ERROR`

#### Scenario: productId y offerId simultáneos
- **WHEN** un usuario envía `{ productId: "...", offerId: "..." }`
- **THEN** el sistema responde 422 con `VALIDATION_ERROR`

### REQ-CART-011: Persistencia de bundle en el carrito

El sistema DEBE persistir la información del bundle en `CartItem` para poder renderizarlo y procesarlo en checkout sin depender del snapshot vigente.

- `CartItem` DEBE almacenar `bundle_offer_id`, `bundle_name`, `bundle_price_vbucks` y `bundle_components` (arreglo de `{ productId, name, slug }` de los constituyentes).
- El precio persistido DEBE ser el `finalPrice` de la API, no la suma de los componentes.
- Los bundles NO DEBEN requerir credenciales Epic, por lo que NO DEBEN almacenar `encrypted_credentials`.

#### Scenario: Bundle persistido con precio de oferta
- **WHEN** el sistema agrega un bundle de 2500 V-Bucks con 4 componentes
- **THEN** persiste `bundle_price_vbucks: 2500` y `bundle_components` con los 4 constituyentes, y NO guarda `encrypted_credentials`

### REQ-CART-012: Listar bundles en el carrito

El sistema DEBE listar los bundles en `GET /api/cart` enriqueciendo la respuesta con los datos persistidos del bundle.

- La respuesta DEBE incluir para cada bundle: `type: 'BUNDLE'`, `bundleOfferId`, `name`, `imageUrl`, `priceVbucks`, `components[]` y `quantity`.
- El precio mostrado DEBE ser `bundle_price_vbucks` snapshotado (precio oferta API).
- La respuesta NO DEBE exponer `encrypted_credentials` ni credenciales desencriptadas.
- Los items DEBEN ordenarse por fecha de creación ascendente, bundles incluidos.

#### Scenario: Carrito con bundle listado
- **WHEN** un usuario autenticado solicita `GET /api/cart` y su carrito contiene un bundle
- **THEN** la respuesta incluye el bundle con `type: 'BUNDLE'`, `bundleOfferId`, nombre, precio fijo y componentes, sin credenciales

### REQ-CART-013: Actualizar y remover bundles del carrito

El sistema DEBE permitir actualizar la cantidad o remover un bundle del carrito igual que cualquier otro item.

- `PATCH /api/cart/[itemId]` DEBE actualizar cantidad respetando el rango 1-10.
- `DELETE /api/cart/[itemId]` DEBE remover el bundle.
- DEBE responder 404 si el item no existe o no pertenece al usuario.
- La cantidad de un bundle representa cuántas veces se regala el paquete completo (1 bundle = todos sus items x1).

#### Scenario: Actualizar cantidad de bundle
- **WHEN** un usuario envía `PATCH /api/cart/[itemId]` con `{ quantity: 2 }` sobre un bundle propio
- **THEN** el sistema actualiza la cantidad y responde con la nueva cantidad

#### Scenario: Remover bundle
- **WHEN** un usuario envía `DELETE /api/cart/[itemId]` sobre un bundle propio
- **THEN** el sistema remueve el item y responde con éxito

### REQ-CART-014: Giftability de bundles

El sistema DEBE manejar la giftability de bundles distinto a la de items individuales.

- Un bundle con `giftable: UNKNOWN` DEBE poder agregarse al carrito y la respuesta DEBE incluir `requiresManualReview: true`.
- Un bundle marcado `NOT_GIFTABLE` por admin tras revisión NO DEBE poder agregarse (422).
- Los constituyentes individuales `NOT_GIFTABLE` NO DEBEN impedir agregar el bundle mientras el bundle mismo sea `UNKNOWN`.

#### Scenario: Bundle UNKNOWN se agrega con revisión manual
- **WHEN** el bundle tiene `giftable: UNKNOWN` y un usuario lo agrega al carrito
- **THEN** el sistema lo agrega con éxito e incluye `requiresManualReview: true` en la respuesta

#### Scenario: Bundle NOT_GIFTABLE bloqueado
- **WHEN** un admin ha marcado el bundle como `NOT_GIFTABLE`
- **THEN** el sistema responde 422 con `NOT_GIFTABLE`

### REQ-CART-015: Intención de agregado preservada tras autenticación

El sistema DEBE, cuando un usuario sin sesión intenta agregar un producto o bundle al carrito y el flujo lo redirige a la autenticación, recordar el item pendiente y agregarlo automáticamente al carrito tras una autenticación exitosa.

- Al redirigir al login, el sistema DEBE conservar la referencia del item pendiente: `productId` para productos individuales y `offerId` para bundles.
- Tras una autenticación exitosa, el sistema DEBE ejecutar el agregado del item pendiente al carrito sin requerir un segundo clic del usuario.
- El agregado DEBE ejecutarse desde la página de `/shop` (handler cliente dentro de la tienda) y NO DEBE requerir una página intermedia ni un delay artificial.
- Si el item pendiente no puede agregarse (ej. producto inactivo o bundle no disponible), el sistema DEBE mostrar feedback con el motivo del fallo y NO bloquear la navegación: DEBE dejar al usuario en la tienda con la sesión validada.
- El auto-agregado NO DEBE aplicarse a items que requieren credenciales Epic (V-Bucks/CREW/BATTLE_PASS); para esos, tras la autenticación el usuario DEBE continuar el flujo normal de credenciales desde la tienda.
- Si el usuario inicia sesión desde `/login` sin item pendiente, NO DEBE agregarse ningún item al carrito.
- Este comportamiento DEBE aplicar por igual a productos individuales y a bundles.

#### Scenario: Agregar producto sin sesión y completar tras login
- **WHEN** un usuario sin sesión hace clic en "Agregar al carrito" de un producto individual, es redirigido a `/login`, y se autentica con éxito
- **THEN** el sistema agrega automáticamente ese producto al carrito desde `/shop` y muestra la confirmación "Validación Exitosa"

#### Scenario: Agregar bundle sin sesión y completar tras login
- **WHEN** un usuario sin sesión hace clic en "Agregar" de un bundle, es redirigido a `/login`, y se autentica con éxito
- **THEN** el sistema agrega automáticamente el bundle (`offerId`) al carrito desde `/shop` y muestra la confirmación de validación

#### Scenario: Item pendiente no disponible
- **WHEN** el item pendiente ya no es agregable (producto inactivo o bundle inexistente) tras la autenticación
- **THEN** el sistema no lo agrega, muestra feedback con el motivo sin bloquear, y deja al usuario en la tienda con la sesión validada

#### Scenario: Login sin item pendiente
- **WHEN** un usuario inicia sesión desde `/login` sin haber intentado agregar un item
- **THEN** el sistema no agrega nada al carrito y lo lleva a `/shop` con la sesión validada

#### Scenario: Auto-agregado de producto que requiere credenciales
- **WHEN** el item pendiente es de tipo V-Bucks/CREW/BATTLE_PASS
- **THEN** el sistema NO lo agrega automáticamente y deja al usuario en la tienda para continuar el flujo de credenciales

### REQ-CART-016: Una unidad por artículo

El sistema DEBE limitar el carrito a UNA unidad por artículo, ya sea un producto individual o un bundle (paquete completo).

- El sistema NO DEBE permitir que un mismo artículo (identificado por `productId` o `bundleOfferId`) aparezca más de una vez en el carrito de un usuario.
- Al intentar agregar un artículo que ya está en el carrito, el sistema DEBE devolver un error `ITEM_ALREADY_IN_CART` y NO DEBE incrementar la cantidad.
- El sistema DEBE rechazar (422) cualquier solicitud de alta `POST /api/cart` con `quantity` mayor a 1.
- La cantidad de cada artículo DEBE fijarse siempre en 1.

#### Scenario: Agregar producto ya presente
- **WHEN** un usuario autenticado tiene el producto X en su carrito y envía `POST /api/cart` con `{ productId: X }`
- **THEN** el sistema responde 409 con `ITEM_ALREADY_IN_CART` y NO modifica el carrito

#### Scenario: Agregar bundle ya presente
- **WHEN** un usuario autenticado tiene el bundle con `offerId: Y` en su carrito y envía `POST /api/cart` con `{ offerId: Y }`
- **THEN** el sistema responde 409 con `ITEM_ALREADY_IN_CART` y NO modifica el carrito

#### Scenario: Cantidad mayor a 1 rechazada
- **WHEN** un usuario envía `POST /api/cart` con `{ productId: X, quantity: 2 }`
- **THEN** el sistema responde 422 con `VALIDATION_ERROR`

### REQ-CART-017: Quitar artículo del carrito

El sistema DEBE seguir permitiendo que el usuario elimine un artículo de su carrito en cualquier momento.

- El artículo eliminado DEBE poder agregarse de nuevo después de ser quitado, cumpliendo la regla de una unidad.
- El endpoint `DELETE /api/cart/[itemId]` DEBE continuar funcionando sin cambios de regla.

#### Scenario: Quitar un artículo
- **WHEN** un usuario quita (DELETE) un artículo que ya estaba en su carrito
- **THEN** el sistema remueve el artículo y, tras ello, puede volver a agregarse una única unidad

### REQ-CART-018: UI de una unidad

La interfaz DEBE reflejar la regla de una unidad tanto en el carrito como en la tienda.

- En `/cart` DEBE mostrarse la cantidad fija "1" por artículo, SIN controles de incrementar/decrementar.
- En `/shop`, el botón "Agregar" de un artículo o bundle que ya está en el carrito DEBE mostrarse deshabilitado con el texto "En carrito" y NO DEBE ejecutar la acción al hacer clic.
- El contador/badge del carrito DEBE equivaler al número de artículos distintos (no a la suma de cantidades).

#### Scenario: Botón deshabilitado en la tienda
- **WHEN** un artículo ya está en el carrito y el usuario ve su tarjeta en `/shop`
- **THEN** el botón "Agregar" aparece deshabilitado con el texto "En carrito"

#### Scenario: Carrito sin stepper de cantidad
- **WHEN** un artículo está en `/cart`
- **THEN** se muestra "1" sin controles +/− y con el botón de quitar disponible

### REQ-CART-019: Resolver conflictos entre artículos y bundles

El sistema MUST cumplir las reglas de resolución descritas a continuación.

El sistema DEBE detectar cuando un bundle contiene uno o más artículos individuales que ya están en el carrito del usuario. La detección DEBE considerar la composición vigente del bundle y NO DEBE permitir que el carrito termine con el artículo individual y el bundle superpuestos cuando el comprador haya elegido sustituirlos.

- Una adición sin conflicto transiciona directamente a `added`.
- Una adición con conflicto transiciona a `pending_resolution` y NO modifica el carrito hasta recibir una decisión válida.
- La decisión `keep_separate` conserva los artículos individuales y cancela la adición del bundle.
- La decisión `replace_with_bundle` elimina únicamente los artículos individuales afectados y agrega el bundle en una operación atómica.
- Si el bundle ya está en el carrito, el sistema DEBE conservar la regla de una unidad y responder con `ITEM_ALREADY_IN_CART`, sin abrir una nueva resolución.

#### Scenario: Agregar bundle sin conflicto
- **WHEN** el usuario agrega un bundle cuyos artículos no coinciden con ningún artículo individual del carrito
- **THEN** el sistema agrega el bundle y responde con el carrito actualizado sin solicitar confirmación

#### Scenario: Detectar artículos incluidos en el bundle
- **WHEN** el usuario agrega un bundle que contiene uno o más artículos individuales presentes en el carrito
- **THEN** el sistema no modifica el carrito, devuelve el estado `pending_resolution` y lista cada artículo en conflicto junto con el bundle propuesto

#### Scenario: Conservar artículos individuales
- **WHEN** el usuario elige `keep_separate` para una resolución pendiente
- **THEN** el sistema conserva los artículos individuales, no agrega el bundle y devuelve el carrito sin cambios con estado `kept_separate`

#### Scenario: Sustituir por bundle
- **WHEN** el usuario elige `replace_with_bundle` para una resolución pendiente válida
- **THEN** el sistema elimina los artículos individuales listados como conflicto, agrega el bundle una sola vez y devuelve el carrito actualizado con estado `replaced_by_bundle`

#### Scenario: Fallo durante sustitución
- **WHEN** no es posible eliminar los artículos en conflicto o agregar el bundle durante `replace_with_bundle`
- **THEN** el sistema revierte toda la operación, conserva el carrito original y devuelve un error de operación sin un estado parcial

### REQ-CART-020: Advertir conflictos en la interfaz de compra

La interfaz MUST cumplir las reglas de advertencia descritas a continuación.

La interfaz DEBE mostrar una advertencia bloqueante y comprensible cuando la API indique `pending_resolution`. La advertencia DEBE identificar el bundle, los artículos individuales afectados y ofrecer acciones para conservarlos por separado o sustituirlos por el bundle.

#### Scenario: Mostrar advertencia de conflicto
- **WHEN** la respuesta de agregar un bundle indica artículos en conflicto
- **THEN** la interfaz muestra el diálogo de resolución y no presenta el bundle como agregado hasta que el comprador elija una alternativa

#### Scenario: Cancelar la resolución
- **WHEN** el comprador cierra o cancela la advertencia
- **THEN** el carrito permanece sin cambios y puede continuar comprando

#### Scenario: Confirmar sustitución desde la advertencia
- **WHEN** el comprador confirma que prefiere el pack completo
- **THEN** la interfaz solicita la sustitución y refleja un único bundle en el carrito, retirando los artículos individuales afectados

### REQ-CART-021: Validar decisiones de resolución

El sistema MUST validar las decisiones antes de modificar el carrito.

El sistema DEBE validar que una decisión de resolución pertenece al usuario autenticado, corresponde al bundle y a los artículos reportados, y no ha sido consumida previamente. Una decisión inválida o vencida NO DEBE modificar el carrito.

#### Scenario: Resolución repetida o vencida
- **WHEN** el usuario envía una decisión para una resolución inexistente, vencida o ya resuelta
- **THEN** el sistema responde con `CART_CONFLICT_RESOLUTION_INVALID` y conserva el carrito sin cambios

#### Scenario: Bundle cambia antes de confirmar
- **WHEN** la composición o disponibilidad del bundle ya no coincide con la información de la resolución pendiente
- **THEN** el sistema rechaza la sustitución, informa que debe revisarse el bundle y conserva el carrito original