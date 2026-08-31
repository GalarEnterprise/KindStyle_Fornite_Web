# Delta Spec: Shop Sections & Bundle Detection

This delta extends the existing `catalog` capability with section navigation and bundle detection.

## Section Navigation

### REQ-NAV-001: Dynamic Section Detection

El sistema DEBE detectar secciones dinámicamente desde la API de Fortnite.

- El campo `layout.name` de cada entrada DEBE extraerse durante la sincronización
- El campo `layout.id` DEBE usarse como identificador estable de sección
- Las secciones DEBEN preservar el orden original de la API
- NO DEBE hardcodearse nombres de secciones

### REQ-NAV-002: Section Model

Cada sección DEBE representarse con:

```typescript
type ShopSection = {
  id: string        // layout.id (estable)
  key: string       // layout.name normalizado
  title: string     // layout.name (texto visible)
  slug: string      // kebab-case del título
  order: number     // posición original en la API
}
```

### REQ-NAV-003: Section Anchors

Cada sección renderizada DEBE tener un anchor HTML único.

- Formato: `id="section-{slug}"`
- Ejemplo: `id="section-featured"`
- La navegación DEBE apuntar a `#section-{slug}`

### REQ-NAV-004: Smooth Scroll

El sistema DEBE implementar scroll suave al hacer clic en una sección.

- Usar `scroll-behavior: smooth` en CSS
- Usar `scroll-margin-top` para compensar header sticky

### REQ-NAV-005: Active Section Detection

La navegación DEBE indicar qué sección está visible.

- Usar `IntersectionObserver` para detectar sección visible
- La sección activa DEBE tener cambio visual discreto
- NO DEBE usar listeners de scroll pesados

### REQ-NAV-006: Desktop Navigation

En desktop, el sistema DEBE mostrar una sidebar de navegación.

- Sidebar DEBE ser sticky
- Cada elemento DEBE ser enlace a `#section-{slug}`
- DEBE resaltar la sección activa

### REQ-NAV-007: Mobile Navigation

En mobile, el sistema DEBE mostrar navegación horizontal desplazable.

- Barra horizontal con overflow-x scroll
- Cada elemento DEBE ser enlace a `#section-{slug}`
- DEBE resaltar la sección activa

### REQ-NAV-008: Deep Links

El sistema DEBE soportar URLs con anchor de sección.

- Formato: `/shop#section-{slug}`
- Al abrir la URL, DEBE posicionarse en la sección correcta
- DEBE funcionar sin pasos adicionales del usuario

### REQ-NAV-009: Section Ordering

Las secciones DEBEN ordenarse según el orden original de la API.

- NO DEBE ordenarse alfabéticamente por defecto
- El orden DEBE provenir de `layout` o metadata de la sección

### REQ-NAV-010: Empty Sections

Una sección NO DEBE renderizarse si está vacía después de la normalización.

### REQ-NAV-011: Duplicate Sections

Si la API devuelve múltiples entradas de la misma sección, DEBEN consolidarse.

- Usar `layout.id` como identificador preferente
- NO consolidar únicamente por coincidencia textual

## Bundle Detection

### REQ-BND-001: Bundle Model

El sistema DEBE distinguir entre:

- **Product**: Artículo cosmético real
- **Offer**: Oferta comercial disponible
- **Bundle**: Oferta comercial con múltiples productos

### REQ-BND-002: Bundle Representation

Cada bundle DEBE representarse con:

```typescript
type ShopBundle = {
  id: string
  offerId: string
  title: string
  priceVbucks: number
  originalPrice?: number
  discount?: number
  imageUrl?: string
  featured?: boolean
  components: ShopProduct[]
  confidence: "HIGH" | "MEDIUM" | "LOW"
}
```

### REQ-BND-003: Bundle Detection Priority

La detección DEBE seguir este orden de prioridad:

1. Identificador explícito de oferta (`offerId`)
2. Identificador explícito de bundle/pack
3. Relaciones explícitas entre oferta y componentes
4. Metadata proporcionada por la API
5. Heurísticas controladas (último recurso)

### REQ-BND-004: No Heuristic Assumptions

NO DEBE asumirse:

- Mismo nombre = mismo pack
- Mismo precio = mismo pack
- Mismo personaje = mismo pack

### REQ-BND-005: Offer Deduplication

Si múltiples registros representan componentes de la misma oferta:

- NO DEBE renderizar cada registro como oferta independiente
- DEBE consolidar en un solo ShopDisplayBundle
- Los componentes DEBEN conservarse internamente

### REQ-BND-006: Individual + Bundle Coexistence

Si un producto existe dentro de un bundle Y tiene oferta individual real:

- Ambas ofertas DEBEN mostrarse
- Esto es correcto porque son ofertas comerciales diferentes

### REQ-BND-007: Confidence Levels

La detección DEBE indicar certeza:

- `HIGH`: Agrupar automáticamente
- `MEDIUM`: Agrupar solo con evidencia suficiente
- `LOW`: Mantener como items separados

### REQ-BND-008: Fallback

Si la detección de bundles falla:

- DEBE renderizar productos individuales
- NO DEBE romper la tienda
- La normalización DEBE ser tolerante a datos incompletos

### REQ-BND-009: No Information Loss

NO DEBE eliminarse información de:

- Base de datos
- Respuesta normalizada
- Estructura interna

El cambio es principalmente en la capa de representación.

### REQ-BND-010: Bundle Card

Los bundles DEBEN usar componente específico.

- Mostrar imagen del bundle
- Mostrar nombre del bundle
- Mostrar precio en V-Bucks y moneda local
- Mostrar botón de agregar
- Permitir consultar componentes (modal/drawer/expansión)

### REQ-BND-011: Bundle Components Display

El sistema DEBE permitir consultar qué incluye un bundle.

- Opción 1: Modal
- Opción 2: Drawer
- Opción 3: Expansión de card
- Opción 4: Página de detalle

## Display Model

### REQ-DSP-001: Display Model Types

El sistema DEBE crear un modelo intermedio:

```typescript
type ShopDisplaySection = {
  id: string
  title: string
  slug: string
  order: number
  entries: ShopDisplayEntry[]
}

type ShopDisplayEntry = ShopDisplayItem | ShopDisplayBundle
```

### REQ-DSP-002: Pure Function

Crear función pura `buildShopDisplayModel(rawShop)`.

- Flujo: Raw → Sections → Normalize → Group → Deduplicate → Sort → Display
- DEBE poder probarse sin React
- La lógica DEBE estar fuera de componentes visuales

### REQ-DSP-003: Separation of Concerns

NO DEBE colocarse lógica de bundles en ProductCard.

Arquitectura:

```
API → Catalog Adapter → Normalizer → Section Builder → Offer Grouper → Bundle Detector → Display Model → React
```

## Performance

### REQ-PER-001: Pre-computation

La agrupación DEBE realizarse durante:

- Normalización del catálogo, O
- Server-side processing

NO DEBE ejecutarse algoritmos pesados en cada render de React.

### REQ-PER-002: Memoization

Aplicar memoización cuando corresponda.

## Backward Compatibility

### REQ-CMP-001: Cart Compatibility

NO DEBE modificarse innecesariamente la lógica actual del carrito.

- Producto individual: agregar producto individual
- Bundle: agregar la oferta/bundle (no componentes individuales)

### REQ-CMP-002: Future Compatibility

Mantener `Bundle → Offer ID → Components` porque puede ser necesario para:

- Solicitudes
- Panel administrativo
- Fulfillment
- Validación de disponibilidad

No implementar esas fases ahora.
