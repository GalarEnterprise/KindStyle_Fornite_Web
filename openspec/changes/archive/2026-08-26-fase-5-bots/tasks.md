# Tasks - Fase 5 Bot System

## 1. Migración y validadores
- [x] Migración Prisma: `FriendshipRequest.request_id` → `String?` (`npm run db:migrate`)
- [x] `apps/web/src/lib/validators/bots.ts`: PlatformSchema (enum EPIC/XBOX/PLAYSTATION), RegisterPlatformSchema (platform + platform_user_id 1-100 chars), BotCreateSchema, BotUpdateSchema (status enum BotStatus)
- [x] Test `__tests__/bots/validators.test.ts`

## 2. Servicios
- [x] `apps/web/src/lib/services/bot/bot-service.ts`: listBots, createBot, updateBot (valida transiciones de estado)
- [x] `apps/web/src/lib/services/friendship/friendship-service.ts`: registerPlatform (crea FriendshipRequest + asigna bots en transacción), assignBots capacity-based con `fields.` comparison, addExtraBot (preserva existentes), markRequestSent, confirmFriendship (con guardas e idempotencia), deriveStatus, getFriendshipStatus, listAdminQueue, getAdminDetail; eventos EventLog en cada acción
- [x] Test `__tests__/bots/friendship-service.test.ts` (mock db): asignación exitosa, NO_BOTS_AVAILABLE sin parciales, extra bot preserva fechas, confirmar sin enviar → REQUEST_NOT_SENT, deriveStatus para cada combinación

## 3. API cliente
- [x] `apps/web/src/app/api/friendship/route.ts`: GET status/panel (`{ request, bots }` o null), POST register platform
- [x] `apps/web/src/app/api/friendship/[id]/add-bot/route.ts`: POST bot adicional (dueño only)
- [x] Test `__tests__/bots/api-friendship.test.ts`: 401 sin auth, 400 inválido

## 4. API admin
- [x] `apps/web/src/app/api/admin/bots/route.ts` (GET list, POST create) y `[id]/route.ts` (PATCH)
- [x] `apps/web/src/app/api/admin/friendships/route.ts` (GET cola) y `[id]/route.ts` (GET detalle)
- [x] `apps/web/src/app/api/admin/friendships/[id]/bots/[botId]/route.ts`: PATCH acción `mark-request-sent` | `confirm-friendship`
- [x] Test `__tests__/bots/api-admin.test.ts`: 401 sin auth, 403 sin rol admin

## 5. Panel cliente /account/bots
- [x] `apps/web/src/hooks/use-friendship.ts` (fetch status + refresh)
- [x] `apps/web/src/components/bots/platform-register-form.tsx` (selector Epic/Xbox/PlayStation con label dinámico)
- [x] `apps/web/src/components/bots/bot-list.tsx` (estados por bot + SOLICITAR faltante)
- [x] `apps/web/src/app/account/bots/page.tsx`
- [x] Criterio: estados No agregado/Solicitud enviada/Amigo visibles; SOLICITAR solo si faltan

## 6. Paneles admin
- [x] `apps/web/src/app/admin/bots/page.tsx` (tabla CRUD con cambio de estado)
- [x] `apps/web/src/app/admin/friendships/page.tsx` (cola priorizada)
- [x] `apps/web/src/app/admin/friendships/[id]/page.tsx` (detalle: COPIAR ID, por bot ABRIR CUENTA / MARCAR SOLICITUD ENVIADA / CONFIRMAR AMISTAD)
- [x] Criterio: cola ordenada sin-procesar primero; acciones deshabilitadas según estado del bot

## 7. Banner, navbar CTA e info modal
- [x] `apps/web/src/components/bots/readiness-banner.tsx` (3 estados) integrado en layout `(public)`
- [x] CTA en `apps/web/src/components/layout/header.tsx` según estado (AGREGAR BOTS ✨ / BOTS 🟡 / BOTS ✓)
- [x] `apps/web/src/components/bots/info-modal.tsx` sin mencionar horas hardcodeadas
- [x] Criterio: banner refleja los 3 estados; modal accesible desde banner y navbar

## 8. Verificación final
- [x] `npm run typecheck` sin errores
- [x] `npm run lint` sin errores nuevos
- [x] `npx vitest run` todos los tests pasando
- [x] Marcar criterios completados
