# Tasks: Navegación por Secciones y Detección de Packs

## Fase 1: Data Capture (1-2 horas)

### Task 1.1: Actualizar schema ✓
**Archivo:** `packages/database/prisma/schema.prisma`

- Agregar `offer_id String?` a ShopItem
- Agregar `bundle_info Json?` a ShopItem
- Ejecutar `npm run db:generate && npm run db:push`

### Task 1.2: Actualizar sync script ✓
**Archivo:** `scripts/sync-catalog.ts`

- Extraer `entry.layout?.name` → `section`
- Extraer `entry.offerId` → `offer_id`
- Extraer `entry.bundle` → `bundle_info`

### Task 1.3: Actualizar worker ✓
**Archivo:** `workers/src/catalog-worker.ts`

- Mismos cambios que sync script

---

## Fase 2: Display Model (1-2 horas)

### Task 2.1: Crear display model ✓
**Archivo:** `apps/web/src/lib/services/catalog/display-model.ts` (nuevo)

- Función `buildShopDisplayModel(items: ShopItem[]): ShopDisplaySection[]`
- Extraer secciones únicas de `item.section`
- Agrupar items por sección
- Si `item.bundle_info` → ShopDisplayBundle
- Si no → ShopDisplayItem

### Task 2.2: Tests del display model ✓
**Archivo:** `apps/web/src/__tests__/catalog/display-model.test.ts` (nuevo)

- Test: item sin bundle → ShopDisplayItem
- Test: item con bundle → ShopDisplayBundle
- Test: sección vacía → excluida

---

## Fase 3: UI (2-3 horas)

### Task 3.1: Crear sidebar ✓
**Archivo:** `apps/web/src/components/shop/section-sidebar.tsx` (nuevo)

- Lista de secciones con enlaces a `#section-{slug}`
- Sticky en desktop
- Horizontal scroll en mobile

### Task 3.2: Crear bundle card ✓
**Archivo:** `apps/web/src/components/shop/bundle-card.tsx` (nuevo)

- Imagen del bundle
- Nombre del bundle
- Precio
- Lista de componentes
- Botón agregar

### Task 3.3: Actualizar shop page ✓
**Archivo:** `apps/web/src/app/(public)/shop/page.tsx`

- Llamar `buildShopDisplayModel()`
- Renderizar sidebar
- Renderizar secciones con anchors
- Renderizar BundleCard o ProductCard

### Task 3.4: CSS ✓
**Archivo:** `apps/web/src/app/globals.css`

- `html { scroll-behavior: smooth; }`
- `.shop-section { scroll-margin-top: 80px; }`

---

## Verification

- [x] `npm run typecheck` pasa
- [x] `npm run lint` pasa
- [x] `npx vitest run` pasa
- [x] Sidebar muestra secciones
- [x] Click en sección → scroll suave
- [x] Bundles se muestran como una card
- [x] Deep links funcionan

## Estimated Total: 4-7 horas
