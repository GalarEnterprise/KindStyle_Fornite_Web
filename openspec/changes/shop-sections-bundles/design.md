# Design: Navegación por Secciones y Detección de Packs

## Datos Reales de la API

```
19 secciones disponibles:
- Pistas de improvisación
- Batcaciones de verano
- Looney Tunes
- Jefe Maestro
- Circuito de expectación
- Clix
- Aura máxima
- A tope de estilo
- Borderlands
- Crash Bandicoot y Spyro el Dragón
- Mercedes-Benz 190E Evo II
- Hoppers
- Formas tontas de morir
- No hay problema
- Ali-A
- Supergirl
- Accesorios de vehículo
- Hombre lobo
- Nissan Silvia

45 entries multi-item (potenciales bundles)
19 bundles explícitos con propiedad `bundle`
```

## Estructura de la API

```json
{
  "offerId": "v2:/...",
  "layout": { "id": "LooneyTunes", "name": "Looney Tunes" },
  "bundle": { "name": "Pato Lucas", "info": "Bundle", "image": "..." },
  "brItems": [
    { "id": "CID_...", "name": "Pato Lucas", "type": { "displayValue": "Traje" } },
    { "id": "BID_...", "name": "Cohete de Duck Dodgers", "type": { "displayValue": "Accesorio mochilero" } }
  ],
  "finalPrice": 1800
}
```

## Cambios Requeridos

### 1. Capturar `layout` y `bundle` en sync

**Archivos:** `scripts/sync-catalog.ts`, `workers/src/catalog-worker.ts`

- Extraer `layout.name` → guardar en `shop_item.section`
- Extraer `bundle` → guardar en nuevo campo `bundle_info` (JSON)
- Extraer `offerId` → guardar en `shop_item.offer_id`

### 2. Schema: agregar campos

**Archivo:** `packages/database/prisma/schema.prisma`

```prisma
model ShopItem {
  // ... existing fields
  offer_id   String?
  bundle_info Json?    // { name, info, image }
}
```

### 3. Display Model simple

**Archivo:** `apps/web/src/lib/services/catalog/display-model.ts` (nuevo)

```typescript
function buildShopDisplayModel(items: ShopItem[]) {
  // 1. Extraer secciones únicas de items.section
  // 2. Agrupar items por sección
  // 3. Dentro de cada sección:
  //    - Si item.bundle_info → ShopDisplayBundle
  //    - Si no → ShopDisplayItem
  // 4. Retornar ShopDisplaySection[]
}
```

### 4. Sidebar de navegación

**Archivo:** `apps/web/src/components/shop/section-sidebar.tsx` (nuevo)

- Lista vertical de secciones
- Cada una es enlace a `#section-{slug}`
- Sticky en desktop
- Horizontal scroll en mobile

### 5. Bundle Card

**Archivo:** `apps/web/src/components/shop/bundle-card.tsx` (nuevo)

- Imagen del bundle
- Nombre del bundle
- Precio V-Bucks + MXN
- Lista de componentes
- Botón agregar

### 6. Integrar en shop page

**Archivo:** `apps/web/src/app/(public)/shop/page.tsx`

- Llamar `buildShopDisplayModel()`
- Renderizar sidebar
- Renderizar secciones con anchors
- Renderizar BundleCard o ProductCard según tipo

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `schema.prisma` | Agregar `offer_id`, `bundle_info` a ShopItem |
| `sync-catalog.ts` | Capturar layout, bundle, offerId |
| `catalog-worker.ts` | Misma captura |
| `shop/page.tsx` | Usar display model, renderizar sidebar |
| `globals.css` | Smooth scroll, scroll-margin |

## Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `display-model.ts` | Función pura de transformación |
| `section-sidebar.tsx` | Navegación lateral |
| `bundle-card.tsx` | Card para bundles |

## Estimación

- **Fase 1 (Data):** 1-2 horas (schema + sync)
- **Fase 2 (Display):** 1-2 horas (display model)
- **Fase 3 (UI):** 2-3 horas (sidebar + bundle card)

**Total:** 4-7 horas
