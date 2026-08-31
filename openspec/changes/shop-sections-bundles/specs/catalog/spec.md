# Delta: Navegación por Secciones y Detección de Packs

Extiende `catalog` con navegación lateral y detección de bundles.

## Secciones

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

## Bundles

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

## Modelo de Datos

```typescript
type ShopSection = {
  id: string        // layout.id
  title: string     // layout.name
  slug: string      // kebab-case del título
  order: number
}

type ShopDisplayBundle = {
  type: 'bundle'
  id: string
  name: string      // bundle.name
  imageUrl: string  // bundle.image
  priceVbucks: number
  components: string[] // nombres de items
  section: string   // layout.name
}

type ShopDisplayItem = {
  type: 'item'
  id: string
  product: Product
  priceVbucks: number
  section: string
}
```

## Tests

- Item sin bundle → ShopDisplayItem
- Item con bundle → ShopDisplayBundle con componentes
- Sección vacía → no renderizar
- Deep link funciona
