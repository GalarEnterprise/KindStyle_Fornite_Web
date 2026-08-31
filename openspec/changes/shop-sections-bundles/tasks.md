# Tasks: Shop Sections & Bundle Detection

## Phase 1: API Types & Data Capture (2-3 hours)

### Task 1.1: Update Fortnite API Types
**Files:** `apps/web/src/lib/services/catalog/fortnite-api.ts`

- Add `layout` field to `FortniteShopEntry`:
  ```typescript
  layout?: { id: string; name: string }
  ```
- Add `offerId` field to `FortniteShopEntry`:
  ```typescript
  offerId?: string
  ```
- Update `FortniteShopEntry` to include `brItems` (currently typed as `items`)
- Verify types match real API response

**Acceptance:** TypeScript compiles, types match API structure

---

### Task 1.2: Update Database Schema
**Files:** `packages/database/prisma/schema.prisma`

- Add `offer_id` field to `ShopItem`:
  ```prisma
  offer_id String?
  ```
- Add index on `offer_id`
- Run `npm run db:generate` and `npm run db:push`

**Acceptance:** Schema updated, Prisma client generated

---

### Task 1.3: Update Sync Script
**Files:** `scripts/sync-catalog.ts`

- Extract `layout.name` and `layout.id` from entry
- Extract `offerId` from entry
- Persist `section: entry.layout?.name || null`
- Persist `offer_id: entry.offerId || null`
- Update `featured` logic: `entry.layout?.name?.toLowerCase().includes('featured')`

**Acceptance:** Sync captures section and offerId, `npm run sync:catalog` works

---

### Task 1.4: Update Catalog Worker
**Files:** `workers/src/catalog-worker.ts`

- Add `layout` and `offerId` to worker's entry type
- Extract and persist `section` from `layout.name`
- Extract and persist `offer_id` from `offerId`
- Remove hardcoded `section: null`

**Acceptance:** Worker captures section data

---

### Task 1.5: Update Snapshot Service
**Files:** `apps/web/src/lib/services/catalog/snapshot-service.ts`

- Pass `section` from entry layout to ShopItem
- Pass `offer_id` from entry to ShopItem
- Remove hardcoded `section: null`

**Acceptance:** App-level sync captures section data

---

## Phase 2: Display Model (3-4 hours)

### Task 2.1: Create Display Model Types
**Files:** `apps/web/src/lib/services/catalog/types.ts` (new or extend)

- Define `ShopSection` type
- Define `ShopDisplayItem` type
- Define `ShopDisplayBundle` type
- Define `ShopDisplayEntry` union type
- Define `ShopDisplaySection` type

**Acceptance:** Types defined and exported

---

### Task 2.2: Create Section Builder
**Files:** `apps/web/src/lib/services/catalog/display-model.ts` (new)

- Function `extractSections(items: ShopItem[]): ShopSection[]`
- Extract unique sections from `item.section`
- Generate slug from title
- Assign order based on first appearance
- Return sorted by order

**Acceptance:** Sections extracted correctly from sample data

---

### Task 2.3: Create Bundle Detector
**Files:** `apps/web/src/lib/services/catalog/display-model.ts`

- Function `detectBundles(items: ShopItem[]): ShopDisplayEntry[]`
- Group items by `offer_id`
- Items with same `offer_id` and count > 1 → bundle
- Items with unique `offer_id` → individual item
- Assign confidence levels
- Handle missing `offer_id` gracefully

**Acceptance:** Bundles detected correctly, individual items preserved

---

### Task 2.4: Create Main Display Model Function
**Files:** `apps/web/src/lib/services/catalog/display-model.ts`

- Function `buildShopDisplayModel(items: ShopItem[]): ShopDisplaySection[]`
- Flow: extract sections → group by section → detect bundles per section → build display
- Return `ShopDisplaySection[]` sorted by order
- Handle empty sections (exclude)

**Acceptance:** Function produces correct output from sample data

---

### Task 2.5: Write Display Model Tests
**Files:** `apps/web/src/__tests__/catalog/display-model.test.ts` (new)

Test cases:
- Single item → ShopDisplayItem
- Multiple items same offer_id → ShopDisplayBundle
- Bundle + individual offer → both displayed
- Same name different offer → no dedup
- Same price different offer → no dedup
- Empty section → excluded
- Duplicate sections → consolidated
- Missing offer_id → fallback to individual

**Acceptance:** All tests pass, 80%+ coverage

---

## Phase 3: Section Navigation UI (3-4 hours)

### Task 3.1: Create Section Navigation Component
**Files:** `apps/web/src/components/shop/section-navigation.tsx` (new)

- Client component
- Props: `sections: ShopSection[]`, `activeSection: string`
- Desktop: sticky sidebar with vertical list
- Mobile: horizontal scrollable bar
- Each item is anchor link to `#section-{slug}`
- Highlight active section

**Acceptance:** Navigation renders correctly on desktop and mobile

---

### Task 3.2: Create Active Section Hook
**Files:** `apps/web/src/hooks/use-active-section.ts` (new)

- Client hook
- Use `IntersectionObserver` to detect visible section
- Return `activeSectionId: string`
- Accept `sectionIds: string[]` and `rootMargin` options
- Cleanup observer on unmount

**Acceptance:** Hook correctly detects visible section

---

### Task 3.3: Add Section Anchors
**Files:** `apps/web/src/components/shop/collection-section.tsx` (modify)

- Add `id="section-{slug}"` to section container
- Add `scroll-margin-top` CSS class
- Ensure section is targetable via anchor

**Acceptance:** Sections have unique IDs, anchors work

---

### Task 3.4: Add Smooth Scroll CSS
**Files:** `apps/web/src/app/globals.css` (modify)

- Add `html { scroll-behavior: smooth; }`
- Add `.shop-section { scroll-margin-top: var(--header-height, 64px); }`

**Acceptance:** Smooth scroll works, sections not hidden under header

---

### Task 3.5: Wire Navigation to Shop Page
**Files:** `apps/web/src/app/(public)/shop/page.tsx` (modify)

- Import `buildShopDisplayModel`
- Call with snapshot items
- Pass sections to `SectionNavigation`
- Use `useActiveSection` hook
- Render sections with anchors

**Acceptance:** Navigation appears, links work, active section highlights

---

## Phase 4: Bundle UI (2-3 hours)

### Task 4.1: Create Bundle Card Component
**Files:** `apps/web/src/components/shop/bundle-card.tsx` (new)

- Props: `bundle: ShopDisplayBundle`
- Display: image, name, price, component count
- Expandable to show components
- Add to cart button

**Acceptance:** Bundle card renders correctly

---

### Task 4.2: Create Bundle Components List
**Files:** `apps/web/src/components/shop/bundle-components-list.tsx` (new)

- Props: `components: Product[]`, `expanded: boolean`
- List of component names with icons
- Toggle expand/collapse
- Smooth animation

**Acceptance:** Components list expands/collapses

---

### Task 4.3: Integrate Bundle Card
**Files:** `apps/web/src/components/shop/product-grid.tsx` (modify)

- Detect entry type (item vs bundle)
- Render `ProductCard` for items
- Render `BundleCard` for bundles
- Maintain grid layout

**Acceptance:** Bundles and items display in same grid

---

## Phase 5: Polish & Testing (2-3 hours)

### Task 5.1: Deep Link Testing
- Test `/shop#section-featured` loads and scrolls to section
- Test hash navigation on page load
- Test browser back/forward with anchors

**Acceptance:** Deep links work correctly

---

### Task 5.2: Responsive Testing
- Test desktop sidebar at 1024px+
- Test mobile horizontal scroll at <768px
- Test tablet intermediate sizes

**Acceptance:** Navigation works all breakpoints

---

### Task 5.3: Performance Check
- Verify display model computation is fast (<50ms for 500 items)
- Verify no unnecessary re-renders
- Verify IntersectionObserver is efficient

**Acceptance:** No performance regression

---

### Task 5.4: Typecheck, Lint, Build
- Run `npm run typecheck`
- Run `npm run lint`
- Run `npx vitest run`
- Run `npm run build`

**Acceptance:** All commands pass

---

### Task 5.5: Update Tests
- Add integration tests for shop page
- Test section navigation renders
- Test bundle detection in integration

**Acceptance:** Test coverage maintained

---

## Dependency Order

```
Phase 1 (Data)
    ↓
Phase 2 (Display Model)
    ↓
Phase 3 (Navigation UI) ──── Phase 4 (Bundle UI)
    ↓
Phase 5 (Polish)
```

## Estimated Total

- **Phase 1:** 2-3 hours
- **Phase 2:** 3-4 hours
- **Phase 3:** 3-4 hours
- **Phase 4:** 2-3 hours
- **Phase 5:** 2-3 hours

**Total:** 12-17 hours

---

## Definition of Done

- [ ] Sections generated dynamically from API
- [ ] Section navigation works (desktop + mobile)
- [ ] Deep links work (`/shop#section-{slug}`)
- [ ] Active section highlighted
- [ ] Bundles detected correctly
- [ ] Bundle components not duplicated
- [ ] Bundle card shows components
- [ ] All tests pass
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
