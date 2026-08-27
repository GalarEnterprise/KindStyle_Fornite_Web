## Why

The app currently creates DB records for notifications (web) in payment-service and timer-service, but has no notification UI, no email/WhatsApp delivery, and no read/unread tracking. Users and admins have no way to see or manage notifications. fase-8 builds the complete notification system across all three channels.

## What Changes

- **Web notifications UI**: Bell icon in header, unread badge, dropdown list, mark-as-read, mark-all-as-read
- **Notification service**: Centralized service with `send`, `sendToAdmin`, `markAsRead`, `getUnreadCount`, `getNotifications`
- **Email delivery via Resend**: HTML email templates for each event type (payment, friendship, timer, order)
- **WhatsApp delivery**: wa.me links with pre-filled messages for eligible events
- **Notification preferences**: User settings to enable/disable email, web, WhatsApp per event type
- **Admin notifications**: Dedicated events for admin (new order, receipt uploaded, friendship accepted)
- **Seed remaining event triggers**: Wire notification creation to all events in the matrix (friendship, timer, order lifecycle)

## Capabilities

### New Capabilities

- `notifications/service`: Centralized notification service — create, read, mark-as-read, unread count, channel dispatch
- `notifications/web-ui`: Web notification UI — bell icon, badge, dropdown, preferences panel
- `notifications/email`: Email delivery via Resend — HTML templates, send per event type
- `notifications/whatsapp`: WhatsApp delivery — wa.me link generation with pre-filled messages

### Modified Capabilities

- `payments/spec`: Add notification dispatch to payment events (receipt uploaded, validated, rejected) — currently has basic `db.notification.create`, needs service integration
- `timers/spec`: Add notification dispatch to timer events (timer started, timer completed) — currently has basic `db.notification.create`, needs service integration

## Impact

- **New files**: `apps/web/src/lib/services/notification/notification-service.ts`, `apps/web/src/components/notifications/` (bell, dropdown, preferences), `apps/web/src/app/api/notifications/` routes, `apps/web/src/lib/email/` templates
- **Modified files**: `payment-service.ts`, `timer-service.ts`, `friendship-service.ts`, `request-service.ts` — replace raw `db.notification.create` with service calls
- **Dependencies**: Resend (already configured), no new packages
- **Database**: No schema changes — `Notification` and `NotificationPreference` models already exist
- **Worker**: Email/WhatsApp sends may be queued via BullMQ for reliability
