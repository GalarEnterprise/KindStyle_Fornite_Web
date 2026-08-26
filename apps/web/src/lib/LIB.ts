// ============================================================
// LIB STRUCTURE
// ============================================================
//
// apps/web/src/lib/
// │
// ├── api/
// │   ├── routes/                   → API Route Handlers
// │   │   ├── auth/
// │   │   │   ├── login/route.ts
// │   │   │   ├── register/route.ts
// │   │   │   ├── verify/route.ts
// │   │   │   ├── logout/route.ts
// │   │   │   ├── refresh/route.ts
// │   │   │   └── sessions/route.ts
// │   │   ├── catalog/
// │   │   │   ├── products/route.ts
// │   │   │   ├── products/[id]/route.ts
// │   │   │   ├── collections/route.ts
// │   │   │   ├── shop/route.ts
// │   │   │   └── search/route.ts
// │   │   ├── cart/
// │   │   │   ├── route.ts
// │   │   │   └── [id]/route.ts
// │   │   ├── requests/
// │   │   │   ├── route.ts
// │   │   │   ├── [id]/route.ts
// │   │   │   └── [id]/message/route.ts
// │   │   ├── friendship/
// │   │   │   ├── route.ts
// │   │   │   ├── [id]/route.ts
// │   │   │   └── [id]/bots/[botId]/route.ts
// │   │   ├── payments/
// │   │   │   ├── route.ts
// │   │   │   ├── [id]/route.ts
// │   │   │   ├── [id]/receipt/route.ts
// │   │   │   └── [id]/validate/route.ts
// │   │   ├── notifications/
// │   │   │   ├── route.ts
// │   │   │   ├── unread-count/route.ts
// │   │   │   └── [id]/read/route.ts
// │   │   ├── currency/
// │   │   │   ├── rates/route.ts
// │   │   │   └── convert/route.ts
// │   │   ├── user/
// │   │   │   ├── profile/route.ts
// │   │   │   ├── fortnite-account/route.ts
// │   │   │   └── preferences/route.ts
// │   │   └── admin/
// │   │       ├── dashboard/route.ts
// │   │       ├── requests/route.ts
// │   │       ├── requests/[id]/route.ts
// │   │       ├── friendships/route.ts
// │   │       ├── friendships/[id]/route.ts
// │   │       ├── friendships/[id]/bots/[botId]/route.ts
// │   │       ├── bots/route.ts
// │   │       ├── bots/[id]/route.ts
// │   │       ├── payments/route.ts
// │   │       ├── payments/[id]/route.ts
// │   │       ├── settings/route.ts
// │   │       └── users/route.ts
// │   │
// │   └── services/                 → API-level services
// │       ├── response.ts           → Helper para respuestas consistentes
// │       └── middleware.ts         → Auth middleware helpers
// │
// ├── services/                     → Business logic services
// │   ├── catalog/
// │   │   ├── fortnite-api.ts       → Cliente de Community API
// │   │   ├── snapshot-service.ts   → Gestión de snapshots
// │   │   ├── product-service.ts    → CRUD de productos
// │   │   ├── collection-service.ts → Organización por colecciones
// │   │   └── giftability-engine.ts → Motor de giftability
// │   │
// │   ├── cart/
// │   │   └── cart-service.ts       → Lógica del carrito
// │   │
// │   ├── request/
// │   │   ├── request-service.ts    → Crear/gestionar solicitudes
// │   │   ├── message-generator.ts  → Generar mensaje para WhatsApp
// │   │   └── request-number.ts     → Generar Request ID
// │   │
// │   ├── friendship/
// │   │   ├── friendship-service.ts → Gestión de friendship requests
// │   │   ├── bot-assignment.ts     → Capacity based assignment
// │   │   └── eligibility-service.ts → Calcular elegibilidad
// │   │
// │   ├── bot/
// │   │   ├── bot-service.ts        → CRUD de bots
// │   │   └── timer-service.ts      → Gestión de timers
// │   │
// │   ├── notification/
// │   │   ├── notification-service.ts → Enviar notificaciones
// │   │   ├── email-service.ts      → Resend integration
// │   │   └── templates/            → Templates por tipo
// │   │
// │   ├── payment/
// │   │   ├── payment-service.ts    → Gestión de pagos
// │   │   └── receipt-service.ts    → Upload/validar comprobantes
// │   │
// │   ├── currency/
// │   │   ├── currency-service.ts   → Conversiones
// │   │   └── exchange-rate-service.ts → Fetch rates
// │   │
// │   └── auth/
// │       ├── auth-service.ts       → Login/register/verify
// │       ├── token-service.ts      → JWT generation/validation
// │       ├── session-service.ts    → Session management
// │       └── encryption-service.ts → Encrypt/decrypt credentials
// │
// ├── db/
// │   ├── client.ts                 → Prisma client singleton
// │   └── transaction.ts           → Transaction helpers
// │
// ├── hooks/                        → React hooks
// │   ├── use-auth.ts
// │   ├── use-cart.ts
// │   ├── use-currency.ts
// │   ├── use-notifications.ts
// │   ├── use-timer.ts
// │   └── use-debounce.ts
// │
// ├── types/                        → TypeScript types
// │   ├── api.ts
// │   ├── auth.ts
// │   ├── catalog.ts
// │   ├── cart.ts
// │   ├── request.ts
// │   ├── friendship.ts
// │   ├── payment.ts
// │   └── notification.ts
// │
// ├── config/
// │   ├── site.ts                   → Site metadata
// │   ├── payment-info.ts           → Datos bancarios
// │   └── constants.ts              → App constants
// │
// └── validators/                   → Zod schemas
//     ├── auth.ts
//     ├── catalog.ts
//     ├── cart.ts
//     ├── request.ts
//     ├── friendship.ts
//     ├── payment.ts
//     └── admin.ts
//
// ============================================================
