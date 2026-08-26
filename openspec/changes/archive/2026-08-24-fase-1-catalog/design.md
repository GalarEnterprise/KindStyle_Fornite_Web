# Fase 1 - Catálogo — Diseño Técnico

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                     CATALOG WORKER                       │
│                                                          │
│  BullMQ Job (cada 1h configurable)                       │
│       │                                                  │
│       ▼                                                  │
│  FortniteApiClient                                       │
│  GET https://fortnite-api.com/v2/shop?language=es        │
│       │                                                  │
│       ▼                                                  │
│  ShopNormalizer                                          │
│  ┌─────────────────────────────────────┐                 │
│  │ 1. Parsear response                 │                 │
│  │ 2. Extraer entries → productos      │                 │
│  │ 3. Normalizar campos                │                 │
│  │ 4. Generar SKU si no existe         │                 │
│  │ 5. Resolver giftability             │                 │
│  └─────────────────────────────────────┘                 │
│       │                                                  │
│       ▼                                                  │
│  SnapshotService                                         │
│  ┌─────────────────────────────────────┐                 │
│  │ 1. Calcular checksum                │                 │
│  │ 2. Comparar con último snapshot     │                 │
│  │ 3. Si diferente → crear snapshot    │                 │
│  │ 4. Upsert products                  │                 │
│  │ 5. Upsert shop_items                │                 │
│  └─────────────────────────────────────┘                 │
│       │                                                  │
│       ▼                                                  │
│  Redis Cache (invalidate + refresh)                       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   API ROUTES                              │
│                                                          │
│  GET /api/shop          → Tienda del día actual          │
│  GET /api/products       → Lista paginada                │
│  GET /api/products/[id]  → Detalle                       │
│  GET /api/products/search?q=  → Búsqueda                 │
│  GET /api/collections    → Lista de colecciones          │
└─────────────────────────────────────────────────────────┘
```

## Decisiones Técnicas

### 1. Fortnite API Client

**Endpoint**: `GET https://fortnite-api.com/v2/shop?language=es`

**Response shape** (simplificado):
```typescript
{
  status: number,
  data: {
    hash: string,
    date: string,         // "2026-08-24T00:00:00Z"
    shopHistory: string[], // array de IDs
    entries: [
      {
        regularPrice: number,      // V-Bucks
        finalPrice: number,
        colors: { background, textColor, ... },
        displayAssetPath: string,
        definition: string,        // asset path
        newDisplayAsset: { materialInstances: [...] },
        items: [
          {
            id: string,            // e.g. "CID_123_ABC"
            name: string,
            description: string,
            type: { value: "outfit", displayValue: "Outfit" },
            rarity: { value: "Rare", displayValue: "Rare" },
            series: null | { value: string, displayValue: string },
            set: { value: string, displayValue: string, id: string },
            introduction: { chapter: string, season: string },
            images: { icon, featured, smallIcon, ... },
            gameplayTags: string[],
            showcaseVideo: string | null,
            variants: [],
          }
        ],
        granted: [...]
      }
    ]
  }
}
```

**Decisión**: Crear cliente wrapper propio, no usar librería de terceros.

**Razones**:
- Control total sobre tipos
- Manejo de errores personalizado
- Posibilidad de cambiar de proveedor sin romper el sistema
- Más ligero

### 2. Normalización de Tipos

La API usa strings como `"outfit"`, `"back_bling"`, etc. Necesitamos mapear a nuestro enum `ProductType`:

```typescript
const TYPE_MAP: Record<string, ProductType> = {
  'outfit': 'OUTFIT',
  'backbling': 'BACK_BLING',
  'pickaxe': 'PICKAXE',
  'glider': 'GLIDER',
  'emote': 'EMOTE',
  'wrap': 'WRAP',
  'music': 'MUSIC_PACK',
  'loadingscreen': 'LOADING_SCREEN',
  'spray': 'SPRAY',
  'contrail': 'CONTRAIL',
  'toy': 'TOY',
  'banner': 'BANNER',
  'bundle': 'BUNDLE',
}

const RARITY_MAP: Record<string, Rarity> = {
  'Common': 'COMMON',
  'Uncommon': 'UNCOMMON',
  'Rare': 'RARE',
  'Epic': 'EPIC',
  'Legendary': 'LEGENDARY',
  'Mythic': 'MYTHIC',
  'Exotic': 'EXOTIC',
  'IconSeries': 'ICON_SERIES',
  'StarWarsSeries': 'STAR_WARS',
  'DCSeries': 'DC',
  'MarvelSeries': 'MARVEL',
  'GamingLegends': 'GAMING_LEGENDS',
  'LavaSeries': 'LAVA',
  'FrozenSeries': 'FROZEN',
  'ShadowSeries': 'SHADOW',
  'SlurpSeries': 'SLURP',
  'DarkSeries': 'DARK',
}
```

### 3. Generación de SKUs

**Formato**: `FORT-NNNNNN` (secuencial, 6 dígitos)

**Decisión**: Usar secuencia en DB, no UUID.

**Razones**:
- Más legible para admin
- Más corto en URLs
- Fácil de comunicar por WhatsApp

**Implementación**:
```typescript
async function generateSku(db: PrismaClient): Promise<string> {
  const last = await db.product.findFirst({
    orderBy: { internal_sku: 'desc' },
    select: { internal_sku: true },
  })
  const next = last
    ? parseInt(last.internal_sku.replace('FORT-', '')) + 1
    : 1
  return `FORT-${String(next).padStart(6, '0')}`
}
```

### 4. Sistema de Snapshots

```
┌──────────────────────────────────────────────┐
│              SHOP SNAPSHOT                    │
│                                               │
│  id: uuid                                     │
│  provider: "fortnite-api"                     │
│  fetched_at: 2026-08-24T01:00:00Z            │
│  shop_date: 2026-08-24T00:00:00Z            │
│  raw_payload: { ... } (JSON completo)         │
│  checksum: "sha256hash"                       │
│                                               │
│  shop_items: [                                │
│    { product_id, price_vbucks, section, ... } │
│    { product_id, price_vbucks, section, ... } │
│  ]                                            │
└──────────────────────────────────────────────┘
```

**Checksum**: SHA-256 del `raw_payload` serializado. Permite detectar si la tienda cambió sin comparar item por item.

**Fallback**: Si la API falla, el frontend sigue sirviendo productos del último snapshot válido. Se muestra badge "Datos del último snapshot" con timestamp.

### 5. Giftability Engine

```typescript
enum GiftabilityStatus {
  GIFTABLE = 'GIFTABLE',
  NOT_GIFTABLE = 'NOT_GIFTABLE',
  UNKNOWN = 'UNKNOWN',
}

function resolveGiftability(product: NormalizedProduct): GiftabilityStatus {
  const notGiftableTypes: ProductType[] = ['BATTLE_PASS', 'CREW', 'VBucks']

  if (notGiftableTypes.includes(product.type)) {
    return GiftabilityStatus.NOT_GIFTABLE
  }

  if (product.type === 'BUNDLE') {
    return GiftabilityStatus.UNKNOWN
  }

  return GiftabilityStatus.GIFTABLE
}
```

**Regla**: Si `UNKNOWN` → `MANUAL_REVIEW` (no asumir TRUE).

### 6. Cache Strategy (Redis)

```typescript
// Keys
const SHOP_CACHE_KEY = 'catalog:shop:current'
const PRODUCTS_CACHE_PREFIX = 'catalog:product:'
const SHOP_TTL = 3600 // 1 hora

// Invalidation
// El worker invalida cache después de cada sync exitosa
```

**Para el MVP**: Redis cache para el endpoint `/api/shop` (el más consultado). Los demás endpoints hacen query directa a DB.

### 7. Organización por Colecciones

La API de Fortnite ya organiza productos en secciones (featured, daily, etc.). Nuestro mapping:

```typescript
const COLLECTION_MAP: Record<string, string> = {
  'Featured': 'Destacados',
  'Daily': 'Tienda del día',
  'Special': 'Especiales',
  'CreatorCode': 'Código de Creador',
}
```

Los productos que no tienen sección asignada se agrupan por tipo (Outfits, Back Bling, etc.).

### 8. Conversión de Precios (Fase 1 - Simplificada)

En Fase 1 usamos precio fijo:
- 100 V-Bucks = 7.5 MXN (valor de `CurrencySetting.vbucks_rate_mxn`)
- El frontend calcula: `priceVbucks * (vbucksRateMxn / 100)`

La conversión dinámica vendrá en Fase 10.

## Estructura de Archivos

```
apps/web/src/
├── lib/
│   ├── services/
│   │   └── catalog/
│   │       ├── fortnite-api.ts          # Cliente API
│   │       ├── shop-normalizer.ts       # Normalizador de tipos
│   │       ├── snapshot-service.ts      # Gestión de snapshots
│   │       ├── product-service.ts       # CRUD productos
│   │       ├── collection-service.ts    # Organización por colecciones
│   │       └── giftability-engine.ts    # Motor de giftability
│   ├── validators/
│   │   └── catalog.ts                   # Zod schemas
│   └── db/
│       └── client.ts                    # Prisma client
│
├── components/
│   └── shop/
│       ├── product-card.tsx             # Card de producto
│       ├── product-grid.tsx             # Grid responsive
│       ├── collection-section.tsx       # Sección de colección
│       ├── shop-search.tsx              # Buscador
│       ├── shop-filters.tsx             # Filtros
│       └── last-update-badge.tsx        # Badge de actualización
│
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Home (incluye tienda)
│   │   └── shop/
│   │       └── page.tsx                 # Tienda completa
│   └── api/
│       ├── shop/
│       │   └── route.ts                 # GET tienda actual
│       ├── products/
│       │   ├── route.ts                 # GET lista paginada
│       │   ├── search/
│       │   │   └── route.ts             # GET búsqueda
│       │   └── [slug]/
│       │       └── route.ts             # GET detalle
│       └── collections/
│           └── route.ts                 # GET colecciones
│
└── workers/
    └── src/
        └── catalog-worker.ts            # Worker de sincronización
```

## API Routes

### GET /api/shop

Retorna la tienda del día con productos organizados por colecciones.

**Response**:
```typescript
{
  success: true,
  data: {
    shopDate: "2026-08-24",
    lastUpdated: "2026-08-24T01:00:00Z",
    collections: [
      {
        name: "Destacados",
        items: [
          {
            id: "uuid",
            internalSku: "FORT-000001",
            name: "Spider-Man",
            priceVbucks: 1500,
            priceMxn: 112.50,
            imageUrl: "...",
            iconUrl: "...",
            type: "OUTFIT",
            rarity: "EPIC",
            giftable: "GIFTABLE"
          }
        ]
      }
    ]
  }
}
```

### GET /api/products?page=1&perPage=20&type=OUTFIT&rarity=EPIC

Lista paginada con filtros.

### GET /api/products/search?q=spider

Búsqueda por nombre (case insensitive).

### GET /api/products/[slug]

Detalle de producto individual.

### GET /api/collections

Lista de colecciones disponibles con conteo de productos.

## Trade-offs

| Decisión | Pro | Contra |
|----------|-----|--------|
| Cliente API propio | Control, tipos propios | Más código que mantener |
| SKU secuencial | Legible, corto | Requiere secuencia DB |
| Cache solo /api/shop | Simple, cubre el caso principal | Otros endpoints sin cache |
| Precio fijo MXN en Fase 1 | Simplicidad | Sin conversión dinámica |
| Secciones desde API | Organización real del juego | Dependemos de cómo Epic organice |

## Alternativas Consideradas

1. **Usar librería fortnite-api**: Descartada — demasiado específica, sin tipos TypeScript estrictos
2. **Cache con SWR/React Query en frontend**: Postpuesto — preferimos cache en servidor (Redis) para Fase 1
3. **GraphQL en lugar de REST**: Descartado — overkill para el volumen de datos actual
