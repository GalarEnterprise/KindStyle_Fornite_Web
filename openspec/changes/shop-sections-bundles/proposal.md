# Proposal: Shop Section Navigation & Bundle Detection

## What

Improve the shop experience by:

1. **Dynamic section navigation** — Generate navigation from API data so users can jump directly to shop sections
2. **Bundle detection** — Correctly identify and display product bundles, preventing duplicate product displays

## Why

### Problem 1 — Sections

The Fortnite API provides shop entries organized by sections (e.g., "Featured", "Daily", "Special Offers"). Currently, the `layout.name` field from the API is not captured in the production sync path, causing all products to be grouped by type instead of by section.

**Current behavior:** Products grouped by type (Outfit, Emote, Pickaxe, etc.)
**Desired behavior:** Products grouped by section as they appear in the Fortnite shop

### Problem 2 — Bundles

The API can return entries with multiple items that belong to the same commercial offer (bundle). Currently, these are displayed as individual products, creating visual duplicates.

**Current behavior:** Bundle components shown as separate products
**Desired behavior:** Bundles displayed as single offers with component details

## Non-Goals

- Modifying authentication, payments, bots, WhatsApp, fulfillment, or admin panel
- Implementing automatic fulfillment
- Changing cart logic for bundles (future phase)
- Adding new API endpoints

## Capabilities Affected

- `catalog` — Primary capability (sections, bundles, display model)
- `cart` — Minor (bundle add-to-cart representation, future phase)

## Success Criteria

- Sections generated dynamically from API data
- Section navigation works on desktop (sidebar) and mobile (horizontal scroll)
- Bundle detection correctly identifies multi-item offers
- Individual products within bundles not duplicated
- Deep links work: `/shop#section-featured`
- All existing tests pass
- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
