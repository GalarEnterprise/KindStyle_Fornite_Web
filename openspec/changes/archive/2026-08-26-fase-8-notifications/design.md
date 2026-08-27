## Context

The app has `Notification` and `NotificationPreference` Prisma models already defined. Basic `db.notification.create` calls exist in `payment-service.ts` and `timer-service.ts` but there is no notification service, no web UI, no email/WhatsApp delivery, and no read/unread tracking. Resend is already configured for email.

## Goals / Non-Goals

**Goals:**
- Centralized notification service with channel dispatch (web, email, WhatsApp)
- Web notification UI: bell icon, unread badge, dropdown, mark-as-read
- Email delivery via Resend with HTML templates
- WhatsApp delivery via wa.me links with pre-filled messages
- User notification preferences (enable/disable per channel)
- Admin notification events (new order, receipt uploaded)

**Non-Goals:**
- Push notifications (browser/mobile)
- SMS notifications
- Real-time WebSocket updates (use polling or SWR revalidation)
- Notification batching or digest emails
- Notification analytics/tracking

## Decisions

### 1. Notification Service Architecture

**Decision**: Create a single `NotificationService` class in `apps/web/src/lib/services/notification/notification-service.ts` that handles creation, dispatch, and read tracking.

**Rationale**: Keeps all notification logic in one place. Existing `db.notification.create` calls in payment/timer services will be replaced with `notificationService.send()`.

**Alternatives considered**:
- Event-driven (emit events, listeners dispatch) — rejected: adds complexity, no real benefit for MVP
- Separate services per channel — rejected: creates duplication in creation/read logic

### 2. Email via Resend (Direct, Not Queued)

**Decision**: Send emails directly from the notification service using Resend SDK, not via BullMQ worker.

**Rationale**: Resend handles retries internally. Adding BullMQ queue for email adds complexity with minimal benefit for MVP volume. If volume grows, can migrate to queued sending later.

**Alternatives considered**:
- BullMQ email worker — rejected: over-engineering for MVP
- Resend webhooks for delivery tracking — deferred: not needed for MVP

### 3. WhatsApp as Link Generation Only

**Decision**: WhatsApp "delivery" means generating a `wa.me` link with pre-filled text, returned in notification metadata. The client opens the link.

**Rationale**: True WhatsApp API integration requires Business API approval, templates, and costs. For MVP, wa.me links are sufficient and zero-cost.

**Alternatives considered**:
- WhatsApp Business API — rejected: requires approval, costs per message
- WhatsApp via Twilio — rejected: adds dependency and cost

### 4. Web Notification Polling

**Decision**: Frontend polls `GET /api/notifications/unread-count` every 30 seconds using SWR, not WebSockets.

**Rationale**: Simpler implementation, no WebSocket infrastructure needed. 30s interval is acceptable for notification latency.

**Alternatives considered**:
- WebSocket/SSE — rejected: requires separate connection management, overkill for MVP
- Server-Sent Events — rejected: similar complexity to WebSocket for this use case

### 5. Notification Preferences Default

**Decision**: All channels enabled by default for new users. Preferences stored in `NotificationPreference` table.

**Rationale**: Users receive all notifications unless they opt out. Matches the spec matrix.

### 6. Email Templates

**Decision**: Create email templates as TypeScript functions returning HTML strings, stored in `apps/web/src/lib/email/templates/`. Use inline CSS for email client compatibility.

**Rationale**: Keeps templates in codebase, version-controlled. No external template engine needed.

**Alternatives considered**:
- MJML — rejected: adds dependency
- React Email — rejected: adds dependency, not needed for simple templates

## Risks / Trade-offs

- **[Email deliverability]** → Mitigation: Use Resend's built-in deliverability. Monitor bounce rates.
- **[Polling latency]** → Mitigation: 30s poll is acceptable for non-critical notifications. Can upgrade to WebSocket later.
- **[WhatsApp link UX]** → Mitigation: Link opens in new tab. User must have WhatsApp Web/desktop. Document this limitation.
- **[No real-time updates]** → Mitigation: SWR revalidation on user action (mark as read) updates UI immediately.

## Migration Plan

1. Deploy notification service and API routes
2. Deploy web UI components (bell icon, dropdown)
3. Update payment-service and timer-service to use notification service
4. Deploy email templates and Resend integration
5. Deploy WhatsApp link generation
6. No database migration needed — models already exist

## Open Questions

- Should admin notifications also appear in the bell icon dropdown, or in a separate admin panel? (Recommendation: same bell icon, differentiated by notification type)
