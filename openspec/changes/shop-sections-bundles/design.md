# Design: Shop Sections & Bundle Detection

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYNC PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│  Fortnite API                                                   │
│       ↓                                                         │
│  Fetch Shop (/v2/shop?language=es)                             │
│       ↓                                                         │
│  Extract layout.name → Section Detection                        │
│       ↓                                                         │
│  Extract offerId → Offer Identification                         │
│       ↓                                                         │
│  Group by offerId → Bundle Detection                            │
│       ↓                                                         │
│  Persist: ShopSnapshot + ShopItem (with section)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DISPLAY PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│  ShopSnapshot (from DB)                                         │
│       ↓                                                         │
│  buildShopDisplayModel()                                        │
│       ↓                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Extract Sections (from ShopItem.section)              │   │
│  │ 2. Group Items by Section                                 │   │
│  │ 3. Within each section:                                   │   │
│  │    a. Group by offerId → Detect Bundles                   │   │
│  │    b. Deduplicate (same offer = single display)           │   │
│  │    c. Create ShopDisplayEntry[]                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│  ShopDisplaySection[]                                           │
│       ↓                                                         │
│  React Components                                               │
│       ├── SectionNavigation (desktop sidebar / mobile scroll)   │
│       └── SectionContent (entries per section)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Section Source: `layout.name` from API

**Decision:** Use `layout.name` from Fortnite API entries as the section identifier.

**Rationale:**
- Real API response shows `layout: { id: string, name: string }` on entries
- Examples: "Featured", "Daily", "Special Offers", "Looney Tunes", "SummerBatman"
- The `layout.id` is stable (e.g., "JT082826", "SummerBatman")
- The `layout.name` is the display name

**Impact:**
- Must update `FortniteShopEntry` type in `fortnite-api.ts` to include `layout`
- Must update sync script and worker to capture `layout`
- Must update `ShopItem.section` to store `layout.name`

### 2. Bundle Detection: `offerId` Grouping

**Decision:** Group items by `offerId` to detect bundles.

**Rationale:**
- Each Fortnite shop entry has a unique `offerId`
- Multiple items in same entry = same commercial offer = bundle
- `offerId` is the most reliable identifier (not name, not price)

**Current State:**
- `offerId` exists in API response but is not captured in app types
- The standalone script captures it but the worker does not

**Impact:**
- Must add `offerId` to `FortniteShopEntry` type
- Must persist `offerId` in `ShopItem` or new `ShopOffer` table
- Must group by `offerId` during display model generation

### 3. Display Model: Pure Function

**Decision:** Create `buildShopDisplayModel()` as a pure function.

**Rationale:**
- Testable without React
- Separates data logic from presentation
- Can be unit tested with various API response shapes

**Signature:**
```typescript
function buildShopDisplayModel(
  items: ShopItemWithProduct[],
  options?: { includeEmpty?: boolean }
): ShopDisplaySection[]
```

### 4. Navigation: CSS + IntersectionObserver

**Decision:** Use native CSS scroll-behavior + IntersectionObserver for active section.

**Rationale:**
- No heavy scroll listeners
- Native smooth scroll is performant
- IntersectionObserver is well-supported

**Desktop:**
```css
.shop-sidebar {
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}
```

**Mobile:**
```css
.shop-nav-mobile {
  display: flex;
  overflow-x: auto;
  gap: 0.5rem;
  padding: 0.5rem;
  -webkit-overflow-scrolling: touch;
}
```

### 5. Bundle Card: Expandable Component

**Decision:** Use expandable card for bundle details.

**Rationale:**
- Keeps UI clean (summary by default)
- Shows components on demand
- Avoids modal complexity

**Alternative considered:** Modal (rejected - too heavy for this phase)

## Data Model Changes

### ShopItem Table

Add `offer_id` column:

```sql
ALTER TABLE shop_items ADD COLUMN offer_id VARCHAR(255);
ALTER TABLE shop_items ADD INDEX idx_shop_items_offer_id (offer_id);
```

### New Types

```typescript
// Section extracted from API
type ShopSection = {
  id: string        // layout.id
  key: string       // layout.name normalized
  title: string     // layout.name
  slug: string      // kebab-case
  order: number
}

// Display entry (union type)
type ShopDisplayEntry = ShopDisplayItem | ShopDisplayBundle

// Single product display
type ShopDisplayItem = {
  type: 'item'
  id: string
  product: Product
  priceVbucks: number
  section: ShopSection
}

// Bundle display
type ShopDisplayBundle = {
  type: 'bundle'
  id: string
  offerId: string
  title: string
  priceVbucks: number
  originalPrice?: number
  discount?: number
  imageUrl?: string
  components: Product[]
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  section: ShopSection
}

// Section with entries
type ShopDisplaySection = {
  id: string
  title: string
  slug: string
  order: number
  entries: ShopDisplayEntry[]
}
```

## File Changes

### Modified Files

| File | Change |
|------|--------|
| `fortnite-api.ts` | Add `layout` and `offerId` to `FortniteShopEntry` |
| `sync-catalog.ts` | Capture `layout` and `offerId`, persist `offer_id` |
| `catalog-worker.ts` | Same as sync script |
| `snapshot-service.ts` | Pass `layout` and `offerId` to ShopItem |
| `shop/page.tsx` | Use `buildShopDisplayModel()`, add navigation |
| `collection-service.ts` | Refactor to use display model |
| `mappings.ts` | Add section slug generation |

### New Files

| File | Purpose |
|------|---------|
| `lib/services/catalog/display-model.ts` | `buildShopDisplayModel()` pure function |
| `components/shop/section-navigation.tsx` | Desktop sidebar + mobile horizontal nav |
| `components/shop/section-nav-item.tsx` | Single nav item with active state |
| `components/shop/bundle-card.tsx` | Bundle display card |
| `components/shop/bundle-components-list.tsx` | Expandable list of bundle components |
| `__tests__/catalog/display-model.test.ts` | Unit tests for display model |

## Trade-offs

### Chosen: Store `offer_id` in ShopItem

**Pros:**
- Simple, no new tables
- Groups by offer during display
- Easy to query

**Cons:**
- Denormalized (same offer_id on multiple rows)

**Alternative rejected:** New `ShopOffer` table (too complex for current needs)

### Chosen: Expandable card for bundles

**Pros:**
- Clean default view
- No modal overhead
- Progressive disclosure

**Cons:**
- Requires client state
- Less prominent than modal

**Alternative rejected:** Modal (heavy, disrupts flow)

### Chosen: IntersectionObserver for active section

**Pros:**
- Performant
- No scroll listeners
- Native API

**Cons:**
- Requires careful threshold tuning

**Alternative rejected:** Scroll event listener (performance risk)

## Risks

1. **API structure changes** — Fortnite API may change `layout` structure
   - Mitigation: Graceful fallback to product-type grouping

2. **offerId not always present** — Some entries may lack offerId
   - Mitigation: Confidence levels, fallback to individual items

3. **Performance with many sections** — 20+ sections could slow navigation
   - Mitigation: Virtual scrolling not needed yet, monitor

## Testing Strategy

### Unit Tests

- `buildShopDisplayModel()` with various inputs
- Bundle detection logic
- Section extraction logic
- Deduplication logic

### Integration Tests

- Shop page renders sections correctly
- Navigation links point to correct anchors
- Deep links work

### Manual Tests

- Desktop sidebar navigation
- Mobile horizontal scroll
- Bundle expand/collapse
- Active section highlighting
