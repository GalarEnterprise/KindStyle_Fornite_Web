## 1. Notification Service Core

- [x] 1.1 Create `apps/web/src/lib/services/notification/notification-service.ts` with `send()`, `sendToAdmin()`, `markAsRead()`, `markAllAsRead()`, `getUnreadCount()`, `getNotifications()`, `getPreferences()`, `updatePreferences()` — verify: service methods compile and unit tests pass
- [x] 1.2 Add Zod schemas for notification input validation in `apps/web/src/lib/services/notification/schemas.ts` — verify: schema validation tests pass
- [x] 1.3 Write unit tests for notification service in `apps/web/src/__tests__/notifications/notification-service.test.ts` — verify: `npx vitest run` passes

## 2. Notification API Routes

- [x] 2.1 Create `GET /api/notifications` endpoint (list with pagination) — verify: returns paginated notifications for authenticated user
- [x] 2.2 Create `GET /api/notifications/unread-count` endpoint — verify: returns unread count integer
- [x] 2.3 Create `POST /api/notifications/[id]/read` endpoint (mark single as read) — verify: notification `read_at` is set
- [x] 2.4 Create `POST /api/notifications/read-all` endpoint (mark all as read) — verify: all unread notifications have `read_at` set
- [x] 2.5 Create `GET /api/notifications/preferences` endpoint — verify: returns user preferences
- [x] 2.6 Create `PUT /api/notifications/preferences` endpoint — verify: preferences are updated in DB
- [x] 2.7 Write API route tests in `apps/web/src/__tests__/notifications/api-routes.test.ts` — verify: `npx vitest run` passes

## 3. Web Notification UI

- [x] 3.1 Create `apps/web/src/components/notifications/notification-bell.tsx` — bell icon with unread badge — verify: component renders with badge when unread > 0
- [x] 3.2 Create `apps/web/src/components/notifications/notification-dropdown.tsx` — dropdown panel with notification list — verify: dropdown opens/closes, shows notifications
- [x] 3.3 Create `apps/web/src/components/notifications/notification-item.tsx` — single notification row with mark-as-read — verify: click marks notification as read
- [x] 3.4 Create `apps/web/src/components/notifications/notification-empty.tsx` — empty state component — verify: shows "No hay notificaciones" message
- [x] 3.5 Integrate NotificationBell into `apps/web/src/components/layout/header.tsx` — verify: bell icon visible in header for authenticated users
- [x] 3.6 Add SWR hook `apps/web/src/hooks/use-notifications.ts` for data fetching with 30s polling — verify: hook returns notifications and unread count

## 4. Notification Preferences UI

- [x] 4.1 Create `apps/web/src/app/(public)/account/notifications/page.tsx` — preferences page with channel toggles — verify: page renders with toggles for email, web, WhatsApp
- [x] 4.2 Add preferences API integration to the page — verify: toggling saves to DB and persists on reload

## 5. Email Templates

- [x] 5.1 Create `apps/web/src/lib/email/templates/index.ts` — template registry mapping event types to templates — verify: all event types have templates
- [x] 5.2 Create timer started email template — verify: HTML renders correctly with bot name, eligibility date
- [x] 5.3 Create timer completed email template — verify: HTML renders correctly with bot name
- [x] 5.4 Create payment validated email template — verify: HTML renders correctly with request number, amount
- [x] 5.5 Create payment rejected email template — verify: HTML renders correctly with reason
- [x] 5.6 Create friendship confirmed email template — verify: HTML renders correctly with bot name
- [x] 5.7 Create new order admin email template — verify: HTML renders correctly with request details
- [x] 5.8 Create receipt uploaded admin email template — verify: HTML renders correctly with request number
- [x] 5.9 Integrate Resend SDK in notification service for email dispatch — verify: emails sent via Resend in development

## 6. WhatsApp Integration

- [x] 6.1 Create `apps/web/src/lib/services/notification/whatsapp-service.ts` — wa.me link generation with pre-filled messages — verify: generates correct links for each event type
- [x] 6.2 Add WhatsApp templates for timer, payment, and friendship events — verify: messages contain correct data
- [x] 6.3 Integrate WhatsApp link generation into notification service dispatch — verify: WhatsApp links returned in notification metadata

## 7. Service Integration

- [x] 7.1 Update `payment-service.ts` to use `NotificationService.send()` instead of raw `db.notification.create` — verify: payment notifications still work, tests pass
- [x] 7.2 Update `timer-service.ts` to use `NotificationService.send()` instead of raw `db.notification.create` — verify: timer notifications still work, tests pass
- [x] 7.3 Add notification dispatch to `request-service.ts` for new order event (admin notification) — verify: admin receives notification when new request created
- [x] 7.4 Add notification dispatch to `friendship-service.ts` for friendship confirmed event — verify: user receives notification when friendship confirmed

## 8. Notification Preferences Defaults

- [x] 8.1 Create default preferences on user registration (all channels enabled) — verify: new users have preferences with all channels true
- [x] 8.2 Add migration/seeding for existing users without preferences — verify: all existing users have notification preferences

## 9. Testing & Polish

- [x] 9.1 Write integration tests for full notification lifecycle (create → dispatch → read) — verify: `npx vitest run` passes
- [x] 9.2 Verify all channels dispatch correctly: web creates record, email sends via Resend, WhatsApp generates link — verify: manual test with each channel
- [x] 9.3 Run `npm run typecheck` and `npm run lint` — verify: 0 TypeScript errors, no new lint warnings
