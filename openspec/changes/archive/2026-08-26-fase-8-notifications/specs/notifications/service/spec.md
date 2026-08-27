## Purpose

Centralized notification service that creates, stores, dispatches, and manages notifications across all channels (web, email, WhatsApp).

## ADDED Requirements

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
- **THEN** system queues an email send job via BullMQ

#### Scenario: Dispatch to WhatsApp channel
- **WHEN** WhatsApp channel is enabled for the notification type
- **THEN** system generates a wa.me link with pre-filled message
