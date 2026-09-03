# Sistema de Notificaciones

## Canales

- **WEB**: Campanita en header, dropdown con lista
- **EMAIL**: Resend
- **WHATSAPP**: wa.me con mensaje prellenado (por ahora)

## Eventos que Generan Notificación

### Para el Cliente

| Evento | Web | Email | WhatsApp |
|--------|-----|-------|----------|
| Solicitud de amistad creada | ✓ | ✓ | - |
| Solicitud de amistad enviada por bot | ✓ | - | - |
| Amistad confirmada | ✓ | ✓ | - |
| Timer iniciado | ✓ | ✓ | ✓ |
| Timer completado (elegible) | ✓ | ✓ | ✓ |
| Nuevo bot disponible | ✓ | ✓ | - |
| Pedido creado | ✓ | ✓ | - |
| Pago validado | ✓ | ✓ | ✓ |
| Pago rechazado | ✓ | ✓ | ✓ |
| Pedido listo para fulfillment | ✓ | ✓ | ✓ |
| Pedido completado | ✓ | ✓ | ✓ |

### Para el Admin

| Evento | Web | Email |
|--------|-----|-------|
| Nuevo pedido | ✓ | ✓ |
| Comprobante subido | ✓ | ✓ |
| Cliente aceptó amistad | ✓ | - |

## Requerimientos

### Requirement: Notification Creation
The system SHALL create a notification record in the database when a notification event occurs.

#### Scenario: Notification created for user
- **WHEN** a notification event is triggered for a specific user
- **THEN** system creates a `Notification` record with `user_id`, `type`, `channel`, `title`, `message`, and `metadata`

#### Scenario: Notification created for admin
- **WHEN** a notification event is triggered for admins
- **THEN** system creates a `Notification` record for each admin user with `channel = 'WEB'`

### Requirement: Unread Count
The system SHALL track and return the count of unread notifications per user.

#### Scenario: Get unread count
- **WHEN** client requests unread notification count
- **THEN** system returns count of notifications where `read_at IS NULL` for the authenticated user

### Requirement: Mark As Read
The system SHALL allow users to mark individual notifications as read.

#### Scenario: Mark single notification as read
- **WHEN** user clicks on a notification
- **THEN** system sets `read_at = NOW()` for that notification

#### Scenario: Mark all notifications as read
- **WHEN** user clicks "Marcar todas como leídas"
- **THEN** system sets `read_at = NOW()` for all unread notifications of that user

### Requirement: Notification List
The system SHALL return a paginated list of notifications for a user.

#### Scenario: Get notifications
- **WHEN** client requests notification list
- **THEN** system returns notifications ordered by `created_at DESC` with pagination

### Requirement: Notification Preferences
The system SHALL allow users to configure notification preferences per channel.

#### Scenario: Get notification preferences
- **WHEN** client requests notification preferences
- **THEN** system returns `email_enabled`, `web_enabled`, `whatsapp_enabled` for the authenticated user

#### Scenario: Update notification preferences
- **WHEN** user updates notification preferences
- **THEN** system persists the new preferences to `notification_preferences` table

### Requirement: Channel Dispatch
The system SHALL dispatch notifications to the appropriate channels based on event type and user preferences.

#### Scenario: Dispatch respects user preferences
- **WHEN** notification is dispatched
- **THEN** system checks user preferences and only sends to enabled channels

#### Scenario: Dispatch to web channel
- **WHEN** web channel is enabled for the notification type
- **THEN** system creates a notification record (visible in UI)

#### Scenario: Dispatch to email channel
- **WHEN** email channel is enabled for the notification type
- **THEN** system sends an email via Resend

#### Scenario: Dispatch to WhatsApp channel
- **WHEN** WhatsApp channel is enabled for the notification type
- **THEN** system generates a wa.me link with pre-filled message

### Requirement: Notification Bell Icon
The system SHALL display a bell icon within the user dropdown menu (not in the main header).

#### Scenario: Bell icon visible in user dropdown
- **WHEN** user is authenticated and opens the user dropdown menu
- **THEN** dropdown displays a bell icon with unread count badge next to the "Notificaciones" item

#### Scenario: Badge shows unread count in dropdown
- **WHEN** user has unread notifications
- **THEN** bell icon in dropdown displays a badge with the unread count

#### Scenario: Badge hidden when no unread in dropdown
- **WHEN** user has no unread notifications
- **THEN** bell icon in dropdown badge is hidden

### Requirement: Notification Dropdown
The system SHALL display the notification panel when clicking the "Notificaciones" item in the user dropdown menu.

#### Scenario: Open notification panel from user dropdown
- **WHEN** user clicks "Notificaciones" in the user dropdown
- **THEN** system closes the user dropdown and displays the notification panel

#### Scenario: Close notification panel
- **WHEN** user clicks outside the notification panel
- **THEN** system closes the panel

#### Scenario: Notification list display
- **WHEN** notification panel is open
- **THEN** system shows notifications ordered by `created_at DESC` with title, message, and relative time

#### Scenario: Empty state
- **WHEN** user has no notifications
- **THEN** system displays "No hay notificaciones" message

### Requirement: Mark As Read Interaction
The system SHALL allow users to mark notifications as read from the dropdown.

#### Scenario: Click notification marks as read
- **WHEN** user clicks on an unread notification in the dropdown
- **THEN** system marks that notification as read and removes the unread badge highlight

#### Scenario: Mark all as read button
- **WHEN** user clicks "Marcar todas como leídas"
- **THEN** system marks all unread notifications as read and updates the badge

### Requirement: Notification Preferences Panel
The system SHALL allow users to manage their notification preferences.

#### Scenario: Access preferences
- **WHEN** user navigates to notification preferences
- **THEN** system displays toggles for email, web, and WhatsApp channels

#### Scenario: Toggle channel
- **WHEN** user toggles a notification channel
- **THEN** system persists the preference and future notifications respect the setting

### Requirement: Email Sending
The system SHALL send emails via Resend when email notifications are triggered.

#### Scenario: Send email notification
- **WHEN** notification event occurs and user has email enabled
- **THEN** system sends an HTML email via Resend with the appropriate template

#### Scenario: Email failure handling
- **WHEN** email sending fails (Resend error, network timeout)
- **THEN** system logs the error and retries up to 3 times with exponential backoff

### Requirement: Email Templates
The system SHALL have HTML email templates for each notification type.

#### Scenario: Timer started email
- **WHEN** timer starts for a bot
- **THEN** system sends email with subject "Tu bot ya está listo - KindStyle" and bot name, eligibility date, remaining time

#### Scenario: Timer completed email
- **WHEN** timer completes (bot eligible)
- **THEN** system sends email with subject "Tu bot es elegible - KindStyle" and bot name

#### Scenario: Payment validated email
- **WHEN** admin validates a payment
- **THEN** system sends email with subject "Pago confirmado - KindStyle" and request number, amount

#### Scenario: Payment rejected email
- **WHEN** admin rejects a payment
- **THEN** system sends email with subject "Pago no válido - KindStyle" and reason

#### Scenario: Friendship confirmed email
- **WHEN** admin confirms friendship
- **THEN** system sends email with subject "Amistad confirmada - KindStyle" and bot name

#### Scenario: New order email (admin)
- **WHEN** a new request is created
- **THEN** system sends email to all admins with subject "Nuevo pedido - KindStyle" and request details

#### Scenario: Receipt uploaded email (admin)
- **WHEN** user uploads a payment receipt
- **THEN** system sends email to all admins with subject "Comprobante subido - KindStyle" and request number

### Requirement: Email From Address
The system SHALL send emails from the configured sender address.

#### Scenario: Correct from address
- **WHEN** system sends an email
- **THEN** email is sent from the address configured in `EMAIL_FROM` environment variable

### Requirement: WhatsApp Link Generation
The system SHALL generate wa.me links with pre-filled messages for WhatsApp notifications.

#### Scenario: Generate WhatsApp link
- **WHEN** notification event occurs and user has WhatsApp enabled and phone number saved
- **THEN** system generates a `https://wa.me/{phone}?text={encoded_message}` link

#### Scenario: No phone number
- **WHEN** notification event occurs and user has no phone number
- **THEN** system skips WhatsApp delivery and only sends to other enabled channels

### Requirement: WhatsApp Message Templates
The system SHALL have WhatsApp message templates for each notification type.

#### Scenario: Timer started message
- **WHEN** timer starts for a bot
- **THEN** message contains bot name, eligibility date, remaining time, and status link

#### Scenario: Timer completed message
- **WHEN** timer completes
- **THEN** message contains bot name and eligibility confirmation

#### Scenario: Payment validated message
- **WHEN** payment is validated
- **THEN** message contains payment confirmation and request number

#### Scenario: Payment rejected message
- **WHEN** payment is rejected
- **THEN** message contains rejection notice and reason

### Requirement: WhatsApp Delivery
The system SHALL deliver WhatsApp notifications by providing the link to the user.

#### Scenario: Return link to client
- **WHEN** WhatsApp notification is generated
- **THEN** system returns the wa.me link in the notification metadata for the client to open
