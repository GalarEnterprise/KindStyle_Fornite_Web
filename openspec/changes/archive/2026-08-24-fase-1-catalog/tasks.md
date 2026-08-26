# Fase 1 - Catálogo — Tareas de Implementación

## Tarea 1: Cliente de Fortnite API

**Objetivo**: Crear el cliente HTTP para consumir la Fortnite API.

**Archivos a crear**:
- `apps/web/src/lib/services/catalog/fortnite-api.ts`

**Criterios de aceptación**:
- [x] Función `fetchShop(language?: string)` que llama a `https://fortnite-api.com/v2/shop`
- [x] Manejo de errores (timeout, 4xx, 5xx) con logging
- [x] Retorna tipo `FortniteShopResponse` con todos los campos necesarios
- [x] Soporta header `x-api-key` desde env var `FORTNITE_API_KEY`
- [x] Timeout configurable (default 30s)
- [x] Test unitario: mock response y validación de parseo

**Estimación**: 1 hora

---

## Tarea 2: Normalizador de productos

**Objetivo**: Convertir la response de la API a nuestro modelo de dominio.

**Archivos a crear**:
- `apps/web/src/lib/services/catalog/shop-normalizer.ts`
- `apps/web/src/lib/services/catalog/mappings.ts`

**Criterios de aceptación**:
- [x] Función `normalizeShopEntry(entry)` → `NormalizedProduct`
- [x] Mapeo de tipos de la API a nuestro `ProductType` enum
- [x] Mapeo de rarezas a nuestro `Rarity` enum
- [x] Extracción de URLs de imágenes (icon, featured, banner)
- [x] Generación de slug a partir del nombre (kebab-case, unique)
- [x] Manejo de productos con múltiples items (bundles)
- [x] Test unitario: normalización de outfit, bundle, emote

**Estimación**: 2 horas

---

## Tarea 3: Motor de Giftability

**Objetivo**: Determinar si un producto puede regalarse.

**Archivos a crear**:
- `apps/web/src/lib/services/catalog/giftability-engine.ts`

**Criterios de aceptación**:
- [x] Función `resolveGiftability(product)` → `GiftabilityStatus`
- [x] `BATTLE_PASS`, `CREW`, `VBucks` → `NOT_GIFTABLE`
- [x] `BUNDLE` → `UNKNOWN` (requiere revisión manual)
- [x] Todos los cosméticos regulares → `GIFTABLE`
- [x] Test unitario para cada caso

**Estimación**: 30 minutos

---

## Tarea 4: Servicio de Productos (CRUD + SKU)

**Objetivo**: CRUD de productos con generación automática de SKU.

**Archivos a crear**:
- `apps/web/src/lib/services/catalog/product-service.ts`

**Criterios de aceptación**:
- [x] Función `upsertProducts(products: NormalizedProduct[])` → upsert en DB
- [x] Generación de SKU secuencial `FORT-NNNNNN`
- [x] Si el producto ya existe (por `fortnite_product_id`), actualiza `last_seen_at`
- [x] Si es nuevo, crea con `first_seen_at` y SKU generado
- [x] Generación de slug unique (con sufijo si hay colisión)
- [x] Transacción atómica para upsert masivo
- [x] Test unitario: crear nuevo, actualizar existente, generación de SKU

**Estimación**: 2 horas

---

## Tarea 5: Servicio de Snapshots

**Objetivo**: Gestionar snapshots de la tienda con detección de cambios.

**Archivos a crear**:
- `apps/web/src/lib/services/catalog/snapshot-service.ts`

**Criterios de aceptación**:
- [x] Función `createSnapshot(shopData, products)` → crea snapshot + shop_items
- [x] Cálculo de checksum SHA-256 del payload
- [x] Comparación con último snapshot: si checksum igual, no crear nuevo
- [x] Si diferente: crear snapshot + vincular shop_items a productos
- [x] Función `getLatestSnapshot()` → último snapshot con shop_items
- [x] Función `getSnapshotByDate(date)` → snapshot de fecha específica
- [x] Test unitario: crear, comparar checksums, fallback

**Estimación**: 2 horas

---

## Tarea 6: Servicio de Colecciones

**Objetivo**: Organizar productos en colecciones como la tienda de Fortnite.

**Archivos a crear**:
- `apps/web/src/lib/services/catalog/collection-service.ts`

**Criterios de aceptación**:
- [x] Función `getCollections()` → lista de colecciones con conteo
- [x] Mapeo de secciones de la API a nombres en español
- [x] Productos sin sección agrupados por tipo
- [x] Función `getProductsByCollection(collectionName, page, perPage)` → paginado
- [x] Ordenamiento por `display_order` dentro de cada colección
- [x] Test unitario: organización por sección y por tipo

**Estimación**: 1.5 horas

---

## Tarea 7: API Routes

**Objetivo**: Crear endpoints REST para el catálogo.

**Archivos a crear**:
- `apps/web/src/app/api/shop/route.ts`
- `apps/web/src/app/api/products/route.ts`
- `apps/web/src/app/api/products/search/route.ts`
- `apps/web/src/app/api/products/[slug]/route.ts`
- `apps/web/src/app/api/collections/route.ts`
- `apps/web/src/lib/validators/catalog.ts`

**Criterios de aceptación**:
- [x] `GET /api/shop` → tienda del día con colecciones
- [x] `GET /api/products?page=1&perPage=20&type=OUTFIT&rarity=EPIC` → paginado + filtros
- [x] `GET /api/products/search?q=spider` → búsqueda case insensitive
- [x] `GET /api/products/[slug]` → detalle de producto
- [x] `GET /api/collections` → lista de colecciones
- [x] Validación con Zod de query params
- [x] Respuestas consistentes `{ success, data, error }`
- [x] Manejo de errores (404, 500)
- [x] Test de integración para cada endpoint

**Estimación**: 3 horas

---

## Tarea 8: Catálogo Worker (sincronización)

**Objetivo**: Implementar el worker que sincroniza la tienda periódicamente.

**Archivos a modificar/crear**:
- `workers/src/catalog-worker.ts` (modificar stub existente)

**Criterios de aceptación**:
- [x] BullMQ job repetido cada 1 hora (configurable via env)
- [x] Flujo: fetch API → normalizar → resolver giftability → comparar snapshot → upsert
- [x] Logging en cada paso (inicio, items encontrados, snapshot creado, errores)
- [x] Si API falla: log error, no crear snapshot, mantener datos anteriores
- [x] Invalidación de cache Redis tras sync exitosa
- [x] Manejo de locks (no ejecutar 2 syncs simultáneos)
- [x] Test: mock API response, verificar flujo completo

**Estimación**: 2 horas

---

## Tarea 9: Prisma Client Singleton + Validators

**Objetivo**: Crear singleton de Prisma y schemas de validación.

**Archivos a crear**:
- `apps/web/src/lib/db/client.ts`
- `apps/web/src/lib/validators/catalog.ts`

**Criterios de aceptación**:
- [x] Singleton de PrismaClient (evitar múltiples instancias en dev)
- [x] Zod schemas para: `Product`, `ShopItem`, `ShopSnapshot`
- [x] Zod schemas para query params de API routes
- [x] Tipos inferidos exportados
- [x] Test: validación de datos válidos e inválidos

**Estimación**: 1 hora

---

## Tarea 10: Componente ProductCard

**Objetivo**: Crear el componente de tarjeta de producto.

**Archivos a crear**:
- `apps/web/src/components/shop/product-card.tsx`
- `apps/web/src/components/shop/product-grid.tsx`

**Criterios de aceptación**:
- [x] Muestra: nombre, icono/imagen, V-Bucks, precio en MXN, botón agregar
- [x] NO muestra textos adicionales (según spec)
- [x] Badge de rareza (color según rareza)
- [x] Botón agregar deshabilitado si no visible
- [x] Responsive (grid de 2-5 columnas según viewport)
- [x] Skeleton loading state
- [x] Test de snapshot

**Estimación**: 1.5 horas

---

## Tarea 11: Componente CollectionSection + página de tienda

**Objetivo**: Crear la sección de colección y la página de tienda.

**Archivos a crear**:
- `apps/web/src/components/shop/collection-section.tsx`
- `apps/web/src/app/(public)/shop/page.tsx`

**Criterios de aceptación**:
- [x] CollectionSection muestra título + grid de productos
- [x] Página shop muestra todas las colecciones del día
- [x] Fetch desde server component (RSC)
- [x] Loading states con skeletons
- [x] Empty state si no hay tienda disponible
- [x] Componente LastUpdateBadge visible

**Estimación**: 2 horas

---

## Tarea 12: Buscador y Filtros

**Objetivo**: Implementar búsqueda y filtros en la tienda.

**Archivos a crear**:
- `apps/web/src/components/shop/shop-search.tsx`
- `apps/web/src/components/shop/shop-filters.tsx`
- `apps/web/src/lib/hooks/use-debounce.ts`

**Criterios de aceptación**:
- [x] Search bar con debounce (300ms)
- [x] Filtro por tipo (dropdown)
- [x] Filtro por rareza (dropdown)
- [x] Filtro por rango de precio (V-Bucks)
- [x] Resultados se actualizan sin recargar página (client component)
- [x] Empty state cuando no hay resultados
- [x] Test: debounce funciona, filtros combinan correctamente

**Estimación**: 2 horas

---

## Tarea 13: Componente LastUpdateBadge + fallback

**Objetivo**: Mostrar información de actualización de la tienda.

**Archivos a crear**:
- `apps/web/src/components/shop/last-update-badge.tsx`

**Criterios de aceptación**:
- [x] Muestra "Última actualización: hace X minutos"
- [x] Si los datos son de un snapshot antiguo (>2h), muestra warning visual
- [x] Tooltip explica que los datos pueden no ser los más recientes
- [x] Formato relativo en español

**Estimación**: 30 minutos

---

## Tarea 14: Seed con datos mock

**Objetivo**: Crear seed de base de datos con productos de ejemplo.

**Archivos a crear**:
- `packages/database/prisma/seed.ts`

**Criterios de aceptación**:
- [x] Crea 20+ productos mock de diferentes tipos
- [x] Crea 1 snapshot con shop_items vinculados
- [x] Crea CurrencySetting con valores por defecto
- [x] Productos incluyen: outfits, back bling, pickaxes, emotes, wraps
- [x] Datos realistas (nombres, precios en V-Bucks, imágenes placeholder)
- [x] `npm run db:seed` funciona correctamente

**Estimación**: 1 hora

---

## Tarea 15: Tests de integración

**Objetivo**: Tests para el flujo completo de sincronización.

**Archivos a crear**:
- `apps/web/src/__tests__/catalog/sync-flow.test.ts`
- `apps/web/src/__tests__/catalog/api-routes.test.ts`

**Criterios de aceptación**:
- [x] Test: flujo completo fetch → normalize → snapshot → upsert
- [x] Test: fallback cuando API falla
- [x] Test: checksum detecta cambios y no-cambios
- [x] Test: API routes retornan datos correctos
- [x] Test: búsqueda encuentra productos
- [x] Coverage >80% en servicios de catálogo

**Estimación**: 2 horas

---

## Resumen

| # | Tarea | Estimación | Dependencias |
|---|-------|-----------|--------------|
| 1 | Cliente Fortnite API | 1h | — |
| 2 | Normalizador | 2h | 1 |
| 3 | Motor de Giftability | 0.5h | — |
| 4 | Servicio de Productos | 2h | 2, 3 |
| 5 | Servicio de Snapshots | 2h | 4 |
| 6 | Servicio de Colecciones | 1.5h | 4 |
| 7 | API Routes | 3h | 4, 5, 6, 9 |
| 8 | Catálogo Worker | 2h | 1, 2, 4, 5 |
| 9 | Prisma Client + Validators | 1h | — |
| 10 | ProductCard Component | 1.5h | — |
| 11 | CollectionSection + página | 2h | 7, 10 |
| 12 | Buscador + Filtros | 2h | 7 |
| 13 | LastUpdateBadge | 0.5h | — |
| 14 | Seed mock data | 1h | 5 |
| 15 | Tests de integración | 2h | 7, 8 |

**Tiempo total estimado**: ~23 horas  
**Tareas paralelizables**: 1+3+9+10+13 | 2 (después de 1) | 6+8 (después de 4+5)

**Orden recomendado**: 9 → 1 → 3 → 2 → 4 → 5 → 6 → 7 → 8 → 10 → 13 → 14 → 11 → 12 → 15
