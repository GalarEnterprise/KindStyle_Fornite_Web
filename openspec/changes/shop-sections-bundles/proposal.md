# Proposal: Navegación por Secciones y Detección de Packs

## What

1. **Navegación lateral** — Sidebar con enlaces directos a cada sección de la tienda
2. **Detección de bundles** — Mostrar packs como una sola oferta en vez de productos individuales duplicados

## Why

- La tienda actual agrupa por tipo de producto, no por sección
- Los bundles aparecen como productos individuales separados
- El usuario no puede navegar rápidamente a secciones específicas

## What's NOT included

- Cambios al carrito
- Cambios a autenticación, pagos, admin
- Nuevos endpoints API
- Lógica compleja de deduplicación

## Success Criteria

- Sidebar con las 19 secciones de la tienda
- Click en sección → scroll suave a esa sección
- Bundles con propiedad `bundle` se muestran como una sola card
- Productos individuales siguen apareciendo normalmente
- `npm run typecheck` pasa
- `npm run lint` pasa
