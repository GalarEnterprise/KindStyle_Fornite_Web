// ============================================================
// APP ROUTER STRUCTURE
// ============================================================
//
// apps/web/src/app/
// │
// ├── layout.tsx                    → Root layout (Header, Footer, Providers)
// ├── page.tsx                      → Home page
// ├── globals.css                   → Global styles + Tailwind
// │
// ├── (public)/                     → Public pages (no auth required)
// │   ├── layout.tsx                → Public layout
// │   ├── shop/
// │   │   └── page.tsx              → Tienda del día (colecciones)
// │   ├── skins/
// │   │   └── page.tsx              → Filtro: Outfits
// │   ├── vbucks/
// │   │   └── page.tsx              → Recargas V-Bucks
// │   ├── club/
// │   │   └── page.tsx              → Fortnite Crew
// │   ├── help/
// │   │   └── page.tsx              → FAQ + Contacto
// │   └── tracking/
// │       └── page.tsx              → Tracking público por Request ID
// │
// ├── (auth)/                       → Auth pages
// │   ├── layout.tsx                → Auth layout (centered)
// │   ├── login/
// │   │   └── page.tsx              → Login (email + código)
// │   ├── register/
// │   │   └── page.tsx              → Registro
// │   └── verify/
// │       └── page.tsx              → Verificar código
// │
// ├── account/                      → Client panel (auth required)
// │   ├── layout.tsx                → Account layout (sidebar)
// │   ├── bots/
// │   │   └── page.tsx              → Mis bots (tracking individual)
// │   ├── requests/
// │   │   ├── page.tsx              → Mis solicitudes
// │   │   └── [id]/
// │   │       └── page.tsx          → Detalle de solicitud
// │   ├── checkout/
// │   │   └── page.tsx              → Confirmar pedido
// │   ├── payment/
// │   │   ├── page.tsx              → Página de pagos
// │   │   └── [id]/
// │   │       └── page.tsx          → Detalle de pago + subir comprobante
// │   ├── notifications/
// │   │   └── page.tsx              → Todas las notificaciones
// │   └── profile/
// │       └── page.tsx              → Editar perfil (nickname, phone, etc.)
// │
// └── admin/                        → Admin panel (admin role required)
//     ├── layout.tsx                → Admin layout (sidebar)
//     ├── dashboard/
//     │   └── page.tsx              → Métricas + overview
//     ├── requests/
//     │   ├── page.tsx              → Lista de solicitudes
//     │   └── [id]/
//     │       └── page.tsx          → Detalle de solicitud
//     ├── friendships/
//     │   ├── page.tsx              → Cola de amistades (priorizada)
//     │   └── [id]/
//     │       └── page.tsx          → Detalle: bots, acciones, timers
//     ├── bots/
//     │   └── page.tsx              → Gestión de bots (CRUD)
//     ├── payments/
//     │   ├── page.tsx              → Validación de pagos
//     │   └── [id]/
//     │       └── page.tsx          → Detalle pago + comprobante
//     ├── settings/
//     │   └── page.tsx              → Configuración (monedas, precios, etc.)
//     └── users/
//         └── page.tsx              → Gestión de admins (Super Admin only)
//
// ============================================================
