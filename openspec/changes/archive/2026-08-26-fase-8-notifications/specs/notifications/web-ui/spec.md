## Purpose

Web notification UI components — bell icon, unread badge, dropdown list, and preferences panel.

## ADDED Requirements

### Requirement: Notification Bell Icon
The system SHALL display a bell icon in the application header.

#### Scenario: Bell icon visible
- **WHEN** user is authenticated
- **THEN** header displays a bell icon with unread count badge

#### Scenario: Badge shows unread count
- **WHEN** user has unread notifications
- **THEN** bell icon displays a badge with the unread count

#### Scenario: Badge hidden when no unread
- **WHEN** user has no unread notifications
- **THEN** bell icon badge is hidden

### Requirement: Notification Dropdown
The system SHALL display a dropdown panel when the bell icon is clicked.

#### Scenario: Open dropdown
- **WHEN** user clicks the bell icon
- **THEN** system displays a dropdown panel with notification list

#### Scenario: Close dropdown
- **WHEN** user clicks outside the dropdown or on the bell icon again
- **THEN** system closes the dropdown panel

#### Scenario: Notification list display
- **WHEN** dropdown is open
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
