// ============================================================
// COMPONENTS STRUCTURE
// ============================================================
//
// apps/web/src/components/
// │
// ├── ui/                           → Reusable UI primitives
// │   ├── button.tsx
// │   ├── input.tsx
// │   ├── modal.tsx
// │   ├── badge.tsx
// │   ├── card.tsx
// │   ├── dropdown.tsx
// │   ├── toast.tsx
// │   ├── spinner.tsx
// │   ├── tooltip.tsx
// │   ├── popover.tsx
// │   ├── tabs.tsx
// │   ├── select.tsx
// │   ├── textarea.tsx
// │   ├── checkbox.tsx
// │   ├── switch.tsx
// │   ├── avatar.tsx
// │   ├── separator.tsx
// │   ├── skeleton.tsx
// │   └── index.ts
// │
// ├── layout/                       → Layout components
// │   ├── header.tsx                → Navbar (logo, links, cart, notifications, auth)
// │   ├── footer.tsx                → Footer (links, redes, legal)
// │   ├── sidebar.tsx               → Sidebar for account/admin
// │   ├── currency-selector.tsx     → Selector de moneda en header
// │   ├── notification-bell.tsx     → Campanita con badge + dropdown
// │   ├── bot-nav-indicator.tsx     → AGREGAR BOTS / BOTS ✓ / BOTS 🟡
// │   └── mobile-nav.tsx            → Menú móvil
// │
// ├── shop/                         → Shop components
// │   ├── product-card.tsx          → Card: nombre + V-Bucks + precio + add
// │   ├── product-grid.tsx          → Grid de productos
// │   ├── collection-section.tsx    → Sección de colección (como Fortnite)
// │   ├── shop-banner.tsx           → Banner de bots sobre productos
// │   ├── shop-filters.tsx          → Filtros (tipo, rareza, precio)
// │   ├── shop-search.tsx           → Buscador
// │   ├── add-to-cart-modal.tsx     → Modal para V-Bucks/Crew (pide credenciales)
// │   └── last-update-badge.tsx     → "Última actualización: hace X min"
// │
// ├── cart/                         → Cart components
// │   ├── cart-drawer.tsx           → Drawer lateral del carrito
// │   ├── cart-item.tsx             → Item en carrito
// │   ├── cart-summary.tsx          → Resumen (total V-Bucks, total moneda)
// │   └── cart-button.tsx           → Botón 🛒 con badge en header
// │
// ├── bots/                         → Bot/Friendship components
// │   ├── bot-status-card.tsx       → Card de bot con estado + timer
// │   ├── bot-timer.tsx             → Cronómetro visual (countdown)
// │   ├── friendship-banner.tsx     → Banner de preparación
// │   ├── platform-selector.tsx     → Epic / Xbox / PlayStation
// │   ├── add-bot-form.tsx          → Form para agregar ID
// │   ├── bot-info-modal.tsx        → Modal [?] explicando por qué
// │   └── friendship-progress.tsx   → "2 de 3 bots agregados"
// │
// ├── auth/                         → Auth components
// │   ├── login-form.tsx            → Form de login
// │   ├── register-form.tsx         → Form de registro
// │   ├── verify-code-form.tsx      → Form de verificación
// │   ├── nickname-form.tsx         → Form para elegir apodo (primer login)
// │   └── session-provider.tsx      → Context provider para auth
// │
// ├── notifications/                → Notification components
// │   ├── notification-list.tsx     → Lista de notificaciones
// │   ├── notification-item.tsx     → Item individual
// │   └── notification-dropdown.tsx → Dropdown desde campanita
// │
// ├── tracking/                     → Tracking components
// │   ├── order-tracker.tsx         → Tracker visual de pedido
// │   ├── payment-tracker.tsx       → Tracker de validación de pago
// │   └── tracking-timeline.tsx     → Timeline de estados
// │
// └── admin/                        → Admin components
//     ├── admin-stats.tsx           → Cards de métricas
//     ├── request-table.tsx         → Tabla de solicitudes
//     ├── friendship-queue.tsx      → Cola priorizada de amistades
//     ├── friendship-detail.tsx     → Detalle con bots y acciones
//     ├── bot-manager.tsx           → CRUD de bots
//     ├── payment-validator.tsx     → Validar/rechazar pagos
//     ├── receipt-viewer.tsx        → Ver/descargar comprobante
//     └── audit-log-table.tsx       → Tabla de audit log
//
// ============================================================
