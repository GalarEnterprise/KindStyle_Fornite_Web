# Catalog — Delta Spec (Fase 1)

Este documento describe los requerimientos **nuevos** o **modificados** que la Fase 1 introduce sobre el spec principal de catalog.

## Requerimientos Nuevos

### REQ-CAT-001: Integración con Fortnite API

El sistema DEBE consumir la Community Fortnite API (`https://fortnite-api.com/v2/shop`) como fuente principal de datos del catálogo.

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
- NO DEBE ejecutar 2 sincronizaciones simultáneas (lock)

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
