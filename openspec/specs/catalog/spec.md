# Sistema de Catálogo

## Fuente de Datos

- **API Principal**: Community Fortnite API (`https://fortnite-api.com/v2/shop`)
- **Sistema**: Snapshots periódicos
- **Fallback**: Último snapshot válido si API falla

## Requerimientos de Integración

### REQ-CAT-001: Integración con Fortnite API

El sistema DEBE consumir la Community Fortnite API como fuente principal de datos del catálogo.

- DEBE soportar el parámetro `language` (default: `es`)
- DEBE usar el header `x-api-key` con la key configurada en `FORTNITE_API_KEY`
- DEBE manejar timeouts (30s configurable)
- DEBE manejar errores HTTP (4xx, 5xx) con logging y retry
- NO DEBE fallar silenciosamente: todo error DEBE ser logueado

### REQ-CAT-002: Sincronización periódica

El sistema DEBE ejecutar un worker de sincronización cada hora (configurable).

- El worker DEBE seguir el flujo: fetch → normalizar → comparar snapshot → upsert → invalidar cache
- Si la API falla, NO DEBE crear un nuevo snapshot
- Si la API falla, DEBE mantener los datos del último snapshot válido
- DEBE loguear cada paso del proceso
- NO DEBE ejecutar 2 sincronizaciones simultáneamente (lock)

### REQ-CAT-003: Detección de cambios por checksum

El sistema DEBE calcular un checksum SHA-256 del payload de la tienda para detectar cambios.

- Si el checksum es igual al del último snapshot, NO DEBE crear un nuevo snapshot
- Si el checksum es diferente, DEBE crear un nuevo snapshot y actualizar shop_items
- El checksum DEBE almacenarse en el campo `checksum` de `ShopSnapshot`

### REQ-CAT-004: Normalización de productos

El sistema DEBE normalizar los datos de la API al modelo de dominio antes de persistir.

- Tipos de la API DEBEN mapearse a nuestro enum `ProductType`
- Rarezas DEBEN mapearse a nuestro enum `Rarity`
- URLs de imágenes DEBEN extraerse (icon, featured, banner)
- El slug DEBE generarse a partir del nombre en kebab-case
- El slug DEBE ser unique (con sufijo numérico si hay colisión)
- Bundles DEBEN tratarse como un solo producto con todos sus items

### REQ-CAT-005: Generación de SKU interno

El sistema DEBE generar SKUs internos en formato `FORT-NNNNNN` (secuencial, 6 dígitos).

- El SKU DEBE ser unique
- DEBE autoincrementarse para cada producto nuevo
- Productos existentes NO DEBEN cambiar su SKU

### REQ-CAT-006: Motor de Giftability

El sistema DEBE implementar un motor de giftability que determine si un producto puede regalarse.

- `BATTLE_PASS`, `CREW`, `VBucks` → `NOT_GIFTABLE`
- `BUNDLE` → `UNKNOWN` (requiere revisión manual)
- Todos los cosméticos regulares → `GIFTABLE`
- Si el resultado es `UNKNOWN`, el sistema NO DEBE asumir que es regalable
- El resultado DEBE almacenarse en el campo `giftable` del producto

### REQ-CAT-007: API REST de catálogo

El sistema DEBE exponer los siguientes endpoints:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/shop` | GET | Tienda del día con colecciones |
| `/api/products` | GET | Lista paginada con filtros |
| `/api/products/search` | GET | Búsqueda por nombre |
| `/api/products/[slug]` | GET | Detalle de producto |
| `/api/collections` | GET | Lista de colecciones |

- Todas las respuestas DEBEN seguir el formato `{ success, data, error }`
- Los query params DEBEN validarse con Zod
- La búsqueda DEBE ser case insensitive

### REQ-CAT-008: Cache de tienda actual

El sistema DEBE cachear la respuesta de `/api/shop` en Redis.

- TTL: 1 hora
- DEBE invalidarse después de cada sincronización exitosa
- Key: `catalog:shop:current`

### REQ-CAT-009: Organización por colecciones

Los productos DEBEN organizarse por colecciones como en la tienda de Fortnite.

- Las secciones de la API DEBEN mapearse a nombres en español
- Productos sin sección DEBEN agruparse por tipo de producto
- Cada colección DEBE tener un `display_order` para ordenamiento
- Los productos de tipos `VBucks`, `BATTLE_PASS` y `CREW` DEBEN agruparse en secciones dedicadas independientes, separadas de las secciones de cosméticos regulares

### REQ-CAT-010: ProductCard visual

La tarjeta de producto DEBE mostrar únicamente:

- Nombre del producto
- Valor en V-Bucks
- Valor en moneda de pago (MXN en Fase 1)
- Icono/imagen del producto
- Botón de agregar al carrito

- NO DEBE mostrar textos adicionales
- NO DEBE mostrar descripciones largas
- DEBE ser responsive (2-5 columnas según viewport)
- Los productos especiales DEBEN usar un componente de tarjeta diferenciado (`SpecialProductCard`) con layout propio

### REQ-CAT-011: Badge de última actualización

El sistema DEBE mostrar un badge indicando cuándo se actualizó la tienda por última vez.

- Formato: "Última actualización: hace X minutos/horas"
- Si los datos tienen más de 2 horas, DEBE mostrar un warning visual
- DEBE tener un tooltip explicando que los datos pueden no ser actuales

### REQ-CAT-012: Precio en moneda local

En Fase 1, el precio en moneda real DEBE calcularse como:

```
precioMxn = priceVbucks * (vbucksRateMxn / 100)
```

- `vbucksRateMxn` default: 7.5 (100 V-Bucks = 7.5 MXN)
- Este valor DEBE obtenerse de la tabla `CurrencySetting`
- La conversión dinámica vendrá en Fase 10

### REQ-CAT-013: Seed con datos mock

El sistema DEBE incluir un script de seed para desarrollo.

- DEBE crear 20+ productos mock de diferentes tipos
- DEBE crear al menos 1 snapshot con shop_items
- DEBE crear el `CurrencySetting` con valores default
- DEBE ejecutarse con `npm run db:seed`

## Flujo de Sincronización

```
Scheduler (cada X minutos)
    ↓
Community API → Fetch Shop
    ↓
Validar + Normalizar
    ↓
Comparar con último snapshot
    ↓
Si hay cambios → Upsert DB + Nuevo Snapshot
    ↓
Actualizar Cache (Redis)
```

## Estructura de Productos

### Identificadores
```
internal_sku          → SKU interno (ej: FORT-000001)
fortnite_product_id   → ID de Epic (ej: CID_123_ABC)
fortnite_offer_id     → Offer ID (ej: V123456)
```

### Campos
```
id, internal_sku, fortnite_product_id, fortnite_offer_id,
name, slug, description,
type, subcategory, rarity, series,
price_vbucks,
image_url, icon_url, featured_image_url, banner_url,
giftable, active, visible,
first_seen_at, last_seen_at,
created_at, updated_at
```

## Organización

### Colecciones (como Fortnite)
- Destacados del día
- Equipados
- Cosméticos (Skins, Back Bling, Pickaxes, Gliders, etc.)
- Emotes
- Wraps
- Music Packs
- Loading Screens
- Sprays
- Contrails
- Toys
- Banners
- Gestos

### Productos Especiales
- **V-Bucks (Recargas)**: 1000, 2800, 5000, 13500
  - Precio asignado por admin (diferente al precio de regalo)
  - Requieren email + contraseña de cuenta Epic
  - Restricción: no cambio de región en 6 meses
  
- **Battle Pass**: 
  - Requiere email + contraseña de cuenta Epic
  
- **Fortnite Crew**:
  - Requiere email + contraseña de cuenta Epic

## Visualización de Producto

En tarjeta solo mostrar:
- Nombre del producto
- Valor en V-Bucks
- Valor en moneda de pago (según moneda seleccionada)
- Icono de agregar al carrito

NO mostrar textos adicionales en la tarjeta.

## Al agregar al carrito

### Productos normales (regalos)
- No requiere información adicional
- Continuar flujo normal

### V-Bucks / Battle Pass / Crew
- Modal/pantalla solicita:
  - Email de cuenta Epic vinculada
  - Contraseña de cuenta Epic vinculada
- Leyenda verde: "Método seguro. No se guardará tu correo y contraseña en la web ni se hará uso indebido."
- Icono WhatsApp para dudas sobre el proceso
- Estas credenciales se encriptan y solo son visibles para admin DESPUÉS de validar pago

## Snapshots

### Tabla shop_snapshots
```
id, provider, fetched_at, shop_date, raw_payload, checksum, created_at
```

### Tabla shop_items
```
id, shop_snapshot_id, product_id, price_vbucks, display_order, section, featured, created_at
```

## Giftability Engine

Motor propio que responde:
```
GIFTABLE
NOT_GIFTABLE
UNKNOWN → MANUAL_REVIEW
```

No asumir TRUE si hay incertidumbre.

## Admin

- Puede asignar precios personalizados a productos
- Puede activar/desactivar productos
- Puede forzar sincronización manual
- Precio V-Bucks configurable: 100 V = 7.5 MXN (default)

## Secciones y Bundles (Navegación y Packs)

### Secciones

### REQ-SEC-001: Detección de Secciones

El sistema DEBE extraer secciones del campo `layout.name` de la API.

- Cada sección DEBE tener `id` (layout.id), `title` (layout.name), `slug` (kebab-case)
- Las secciones DEBEN preservar el orden de la API
- NO DEBE hardcodearse nombres de secciones

### REQ-SEC-002: Navegación Lateral

El sistema DEBE mostrar una sidebar con enlaces a cada sección.

- Cada enlace DEBE apuntar a `#section-{slug}`
- DEBE resaltar la sección actualmente visible
- En mobile, DEBE ser una barra horizontal desplazable

### REQ-SEC-003: Scroll Suave

Al hacer clic en una sección, DEBE hacer scroll suave.

- Usar `scroll-behavior: smooth`
- Usar `scroll-margin-top` para compensar header sticky

### REQ-SEC-004: Anchors

Cada sección DEBE tener `id="section-{slug}"`.

- Los deep links DEBEN funcionar: `/shop#section-featured`

### Bundles

### REQ-BND-001: Detección de Bundles

El sistema DEBE detectar bundles usando la propiedad `bundle` de la API.

- Si un entry tiene `bundle: { name, info, image }`, ES un bundle
- El `bundle.name` es el nombre del pack
- Los items del entry son los componentes del bundle

### REQ-BND-002: Visualización de Bundles

Los bundles DEBEN mostrarse como una sola card.

- Mostrar imagen del bundle (`bundle.image`)
- Mostrar nombre del bundle (`bundle.name`)
- Mostrar precio total (V-Bucks + MXN)
- Botón de agregar al carrito

### REQ-BND-003: Componentes del Bundle

Los componentes DEBEN mostrarse debajo del bundle.

- Lista de nombres de componentes
- Sin precios individuales (solo el bundle tiene precio)
- Formato simple: "Incluye: Item 1, Item 2, Item 3"

### REQ-BND-004: Fallback

Si un entry NO tiene `bundle`, se muestra como item individual.

- No romper la tienda si `bundle` es undefined
- Products sin bundle → ProductCard normal

## Secciones de Productos Especiales

### REQ-SPC-001: Sección dedicada de V-Bucks

El sistema DEBE crear una sección dedicada para productos de tipo `VBucks`.

- La sección DEBE mostrarse con título "V-Bucks" y un slug `vbucks`
- La sección DEBE incluir un aviso: "Requiere cuenta de Epic Games"
- La sección DEBE mostrarse al final de la página, después de las secciones de cosméticos regulares
- Si no hay productos `VBucks` en el snapshot actual, la sección NO DEBE renderizarse
- El `display_order` de la sección DEBE ser fijo y conocido (no depende del orden de la API)

#### Scenario: V-Bucks disponibles en el shop

- **WHEN** el snapshot contiene al menos un producto de tipo `VBucks`
- **THEN** se renderiza una sección "V-Bucks" con tarjetas de productos especiales
- **AND** la sección aparece al final de la página, después de las secciones de cosméticos

#### Scenario: Sin V-Bucks en el shop

- **WHEN** el snapshot no contiene productos de tipo `VBucks`
- **THEN** la sección "V-Bucks" no se renderiza
- **AND** no se muestra un contenedor vacío

### REQ-SPC-002: Sección dedicada de Battle Pass

El sistema DEBE crear una sección dedicada para productos de tipo `BATTLE_PASS`.

- La sección DEBE mostrarse con título "Pase de Batalla" y un slug `pase-de-batalla`
- La sección DEBE incluir un aviso: "Requiere cuenta de Epic Games"
- La sección DEBE mostrarse en la zona de secciones especiales al final de la página, después de las secciones de cosméticos
- Si no hay productos `BATTLE_PASS` en el snapshot actual, la sección NO DEBE renderizarse

#### Scenario: Battle Pass disponible en el shop

- **WHEN** el snapshot contiene al menos un producto de tipo `BATTLE_PASS`
- **THEN** se renderiza una sección "Pase de Batalla" con tarjetas de productos especiales
- **AND** la sección aparece en la zona de especiales al final de la página, después de las secciones de cosméticos

#### Scenario: Sin Battle Pass en el shop

- **WHEN** el snapshot no contiene productos de tipo `BATTLE_PASS`
- **THEN** la sección "Pase de Batalla" no se renderiza

### REQ-SPC-003: Sección dedicada de Crew

El sistema DEBE crear una sección dedicada para productos de tipo `CREW`.

- La sección DEBE mostrarse con título "Fortnite Crew" y un slug `fortnite-crew`
- La sección DEBE incluir un aviso: "Requiere cuenta de Epic Games"
- La sección DEBE mostrarse en la zona de secciones especiales al final de la página, después de las secciones de cosméticos
- Si no hay productos `CREW` en el snapshot actual, la sección NO DEBE renderizarse

#### Scenario: Crew disponible en el shop

- **WHEN** el snapshot contiene al menos un producto de tipo `CREW`
- **THEN** se renderiza una sección "Fortnite Crew" con tarjetas de productos especiales
- **AND** la sección aparece en la zona de especiales al final de la página, después de las secciones de cosméticos

#### Scenario: Sin Crew en el shop

- **WHEN** el snapshot no contiene productos de tipo `CREW`
- **THEN** la sección "Fortnite Crew" no se renderiza

### REQ-SPC-004: Tarjeta de producto especial

Los productos especiales DEBEN usar un componente `SpecialProductCard` diferenciado del `ProductCard` regular.

- La tarjeta DEBE mostrar: nombre del producto, valor en V-Bucks, valor en moneda de pago, imagen/icono
- La tarjeta DEBE incluir un badge distintivo por tipo (ej: "V-Bucks", "Pase", "Crew")
- La tarjeta DEBE incluir un aviso en texto pequeño: "Requiere credenciales de Epic Games"
- La tarjeta DEBE usar el botón existente de agregar al carrito (que ya maneja el modal de credenciales)
- La tarjeta DEBE ser responsive (2-5 columnas según viewport, consistente con `ProductCard`)
- NO DEBE mostrar descripciones largas ni textos adicionales

#### Scenario: Renderizado de SpecialProductCard

- **WHEN** se renderiza un producto de tipo `VBucks` en su sección dedicada
- **THEN** la tarjeta muestra badge "V-Bucks", imagen, precio y aviso de credenciales
- **AND** el botón de agregar al carrito abre el modal de credenciales existente

### REQ-SPC-005: Orden de secciones especiales

Las secciones especiales DEBEN mostrarse en un orden fijo al final de la página, después de las secciones de cosméticos regulares.

- Orden: Secciones de la API (cosméticos) → V-Bucks → Battle Pass → Crew → Pistas de improvisación
- Si una sección está vacía (sin productos), DEBE omitirse sin alterar el orden de las demás
- Las secciones de cosméticos DEBEN conservar su orden original de la API

#### Scenario: Todas las secciones especiales vacías

- **WHEN** no hay productos de tipos `VBucks`, `BATTLE_PASS`, `CREW` ni `JAM_TRACK`
- **THEN** solo se muestran las secciones de cosméticos regulares
- **AND** no se muestra ningún espacio vacío ni placeholder

#### Scenario: Solo V-Bucks disponible

- **WHEN** solo hay productos de tipo `VBucks`
- **THEN** se muestran las secciones de cosméticos seguidas de la sección "V-Bucks"
- **AND** no se muestran secciones vacías de Battle Pass, Crew ni Pistas

#### Scenario: Secciones especiales después de cosméticos

- **WHEN** hay productos de tipos `VBucks`, `BATTLE_PASS`, `CREW` y `JAM_TRACK`
- **THEN** las secciones de cosméticos aparecen primero
- **AND** las secciones especiales aparecen después en el orden: V-Bucks → Battle Pass → Crew → Pistas de improvisación

### REQ-SPC-006: Navegación lateral con secciones especiales

La sidebar de navegación DEBE incluir enlaces a las secciones especiales.

- Cada sección especial DEBE tener un enlace en la sidebar con el mismo formato que las secciones regulares
- Los enlaces DEBEN apuntar a `#section-{slug}` (ej: `#section-vbucks`)
- Las secciones especiales DEBEN aparecer al final de la lista de navegación, acorde al orden de las secciones en la página
- El scroll-spy DEBE funcionar correctamente con las nuevas secciones

#### Scenario: Sidebar incluye secciones especiales

- **WHEN** la página del shop se renderiza con secciones especiales
- **THEN** la sidebar muestra enlaces para V-Bucks, Battle Pass y Crew (si tienen productos)
- **AND** el scroll-spy resalta la sección activa al hacer scroll

### REQ-SPC-007: Validación de URL de imagen de producto

El sistema DEBE validar y filtrar URLs de imagen antes de renderizarlas en las tarjetas de producto.

- Si `image_url` es null o vacía, DEBE usar `icon_url` como fallback
- Si ambas URLs son null o vacías, DEBE mostrar un placeholder genérico
- Las URLs DEBEN ser validadas como URIs válidas antes de usarlas en atributos `src`
- Las URLs DEBEN usar protocolo HTTPS o ser rutas relativas

#### Scenario: Producto con image_url válida

- **WHEN** un producto tiene `image_url` con valor HTTPS válido
- **THEN** la tarjeta muestra la imagen de `image_url`

#### Scenario: Producto sin image_url pero con icon_url

- **WHEN** un producto tiene `image_url` null y `icon_url` con valor válido
- **THEN** la tarjeta muestra la imagen de `icon_url`

#### Scenario: Producto sin ninguna imagen

- **WHEN** un producto tiene tanto `image_url` como `icon_url` en null o vacío
- **THEN** la tarjeta muestra un placeholder genérico con icono de imagen
- **AND** no se genera un error de renderizado

#### Scenario: URL de imagen con protocolo no válido

- **WHEN** un producto tiene `image_url` con protocolo distinto de HTTPS (ej: `http://`, `javascript:`, etc.)
- **THEN** la imagen NO se renderiza
- **AND** se usa `icon_url` como fallback
- **AND** si `icon_url` tampoco es válida, se muestra el placeholder

## Sección Banners — Datos de Referencia
### Requirement: Sincronización de banners de referencia

El sistema DEBE sincronizar los datos de referencia de banners desde la Community Fortnite API además del `/v2/shop`.

- DEBE consumir `GET /v1/banners` (soportando `language`) y persistir `id`, `devName`, `name`, `category` e imágenes (`smallIcon`, `icon`)
- DEBE consumir `GET /v1/banners/colors` y persistir el mapeo token→valor de color (`id`, `color`, `category`)
- DEBE ejecutarse dentro del flujo de sincronización del worker, con frecuencia menor o igual a la del shop
- Si la API de banners falla, NO DEBE abortar la sincronización del shop: DEBE conservar los últimos datos de referencia persistidos
- Todo error DEBE ser logueado con contexto

#### Scenario: Sincronización exitosa de banners

- **WHEN** el worker completa un fetch del `/v2/shop` y obtiene `200` en `/v1/banners` y `/v1/banners/colors`
- **THEN** los banners y tokens de color quedan actualizados en la base de datos
- **AND** la operación queda registrada en el log sin errores

#### Scenario: Fallo del endpoint de banners

- **WHEN** `/v1/banners` responde `5xx` o expira el timeout durante una sincronización
- **THEN** el shop del día se sincroniza con normalidad
- **AND** los datos de referencia de banners conservan su último valor válido
- **AND** el error queda logueado

### Requirement: Persistencia del tema visual por entry

El sistema DEBE persistir por cada entry de la tienda los datos que determinan el tema de su sección, sin descartarlos durante la normalización.

- DEBE guardarse `layout.id` junto con `layout.name` (hoy solo se conserva el nombre)
- DEBE guardarse `colors` del entry (`color1`, `color3`, `textBackgroundColor` cuando existan)
- DEBE guardarse la URL de arte del tile del entry (`newDisplayAsset` → imagen de oferta/tile) disponible para resolución de banners
- El checksum del snapshot DEBE cubrir estos campos al formar parte del payload crudo
- NO DEBE modificarse el `banner_url` por producto existente ni el comportamiento de carrito

#### Scenario: Entry con layout y colores

- **WHEN** un entry del `/v2/shop` trae `layout.id = "SummerBatman"` y `colors = { color1: "f86b71ff", ... }`
- **THEN** el `ShopItem` persistido expone `layoutId` y los colores del entry
- **AND** estos datos son recuperables para construir el modelo de visualización de secciones

#### Scenario: Entry sin layout (bucket "Otros")

- **WHEN** un entry llega sin `layout`
- **THEN** se normaliza a la sección `Otros` igual que hoy
- **AND** su tema no se usa como base del banner de otra sección
