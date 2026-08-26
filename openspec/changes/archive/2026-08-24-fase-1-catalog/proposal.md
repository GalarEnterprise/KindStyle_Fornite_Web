# Fase 1 - Catálogo

## Qué

Implementar el sistema completo de catálogo de productos de Fortnite: integración con la Community Fortnite API, sincronización automática de la tienda diaria, sistema de snapshots, organización por colecciones (como la tienda del juego), motor de giftability, y API routes para servir productos al frontend.

## Por Qué

El catálogo es la base de la tienda. Sin productos visibles y actualizados, el resto del flujo (carrito, requests, bots, pagos) no puede funcionar. El cliente debe ver la tienda de Fortnite organizada por colecciones con precios en V-Bucks y moneda real, tal como aparece en el juego.

## Alcance

### In-scope
- Cliente para Fortnite API (`https://fortnite-api.com/v2/shop`)
- Worker de sincronización periódica (cada hora configurable)
- Sistema de snapshots (almacenar cada tienda diaria completa)
- Fallback al último snapshot válido si API falla
- Normalización y upsert de productos
- Motor de giftability (GIFTABLE / NOT_GIFTABLE / UNKNOWN)
- Generación de SKUs internos
- API routes: `/api/shop`, `/api/products`, `/api/products/[id]`, `/api/products/search`
- Componente ProductCard (nombre + V-Bucks + precio + agregar)
- Página de tienda organizada por colecciones
- Búsqueda y filtros (tipo, rareza, precio)
- Badge de última actualización
- Seed con datos mock para desarrollo

### Non-goals
- No implementar carrito (Fase 3)
- No implementar autenticación (Fase 2)
- No implementar conversión de monedas dinámica (Fase 10) — usar precio fijo en MXN
- No implementar credenciales de Epic (eso pertenece al carrito)
- No implementar panel admin de productos — solo las API routes
- No implementar fulfillment automático

## Specs afectadas

- `catalog` — Nuevos requerimientos de sincronización, API routes, y UI

## Criterios de éxito

1. El worker sincroniza la tienda desde Fortnite API cada hora
2. Si la API falla, la tienda muestra datos del último snapshot válido
3. El badge "Última actualización" muestra tiempo relativo correcto
4. La página de tienda muestra productos organizados por colecciones
5. El buscador y filtros funcionan correctamente
6. Los precios se muestran en V-Bucks y MXN
7. El motor de giftability responde correctamente
8. Los tests cubren el flujo de sincronización
9. `npm run typecheck` pasa sin errores
10. `npm run lint` pasa sin errores

## Estimación

- **Duración**: 6-8 horas
- **Complejidad**: Media
- **Riesgo**: Medio (dependencia de API externa)
