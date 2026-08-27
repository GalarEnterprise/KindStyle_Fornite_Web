## ADDED Requirements

### Requirement: Admin Dashboard Metrics
The system SHALL display a dashboard with key business metrics for the admin.

#### Scenario: View dashboard
- **WHEN** admin navigates to `/admin/dashboard`
- **THEN** system displays metrics: orders (day/week/month), revenue (day/week/month), pending validations, active friendships, active bots

#### Scenario: Metrics are real-time
- **WHEN** admin views dashboard
- **THEN** metrics reflect current database state without requiring page refresh

### Requirement: Admin Requests Panel
The system SHALL provide a panel to view and manage all customer requests.

#### Scenario: View requests list
- **WHEN** admin navigates to `/admin/requests`
- **THEN** system displays requests ordered by `created_at DESC` with status filter

#### Scenario: Filter by status
- **WHEN** admin selects a status filter
- **THEN** system displays only requests matching that status

#### Scenario: View request detail
- **WHEN** admin clicks on a request
- **THEN** system displays client info, Fortnite ID, products, friendship request status, and payment status

#### Scenario: Copy request ID
- **WHEN** admin clicks copy button on request ID
- **THEN** system copies the request number to clipboard

### Requirement: Admin Friendships Panel
The system SHALL provide a panel to manage friendship requests with priority ordering.

#### Scenario: View friendships queue
- **WHEN** admin navigates to `/admin/friendships`
- **THEN** system displays friendships ordered by: eligibility_at ASC (soonest), created_at ASC (oldest), unprocessed first

#### Scenario: View friendship detail
- **WHEN** admin clicks on a friendship
- **THEN** system displays client info, assigned bots with individual statuses and timer countdowns

#### Scenario: Send friendship request
- **WHEN** admin clicks "ENVIAR SOLICITUD" on a bot
- **THEN** system updates bot status to `REQUEST_SENT` and logs the action

#### Scenario: Mark request sent
- **WHEN** admin clicks "MARCAR ENVIADA"
- **THEN** system updates bot status to `REQUEST_SENT` and logs the action

#### Scenario: Confirm friendship
- **WHEN** admin clicks "CONFIRMAR AMISTAD"
- **THEN** system updates bot friendship_status to `ACCEPTED`, sets `friendship_confirmed_at`, starts timer, and logs the action

### Requirement: Admin Bots Panel
The system SHALL provide a panel to manage fulfillment bots.

#### Scenario: View bots list
- **WHEN** admin navigates to `/admin/bots`
- **THEN** system displays all bots with name, platform, status, and current assignments

#### Scenario: Add new bot
- **WHEN** admin submits new bot form (name, platform, external_id)
- **THEN** system creates bot record and logs the action

#### Scenario: Edit bot
- **WHEN** admin updates bot details (capacity, status)
- **THEN** system persists changes and logs the action

#### Scenario: Deactivate bot
- **WHEN** admin deactivates a bot
- **THEN** system sets bot status to `INACTIVE` and logs the action

### Requirement: Admin Settings Panel
The system SHALL provide a settings panel for global configuration.

#### Scenario: View settings
- **WHEN** admin navigates to `/admin/settings`
- **THEN** system displays current configuration: V-Buck ratio, friendship period, WhatsApp number, email contact

#### Scenario: Update V-Buck ratio
- **WHEN** admin updates the V-Buck to MXN ratio
- **THEN** system persists the new ratio and future price calculations use it

#### Scenario: Update friendship period
- **WHEN** admin updates the friendship period (hours)
- **THEN** system persists the new period and future timer calculations use it

#### Scenario: Force catalog sync
- **WHEN** admin clicks "Forzar sync"
- **THEN** system triggers catalog synchronization and displays last sync timestamp

### Requirement: Admin Users Panel
The system SHALL provide a user management panel restricted to Super Admin.

#### Scenario: Super Admin views admin list
- **WHEN** Super Admin navigates to `/admin/users`
- **THEN** system displays all admin accounts with role and status

#### Scenario: Super Admin creates admin
- **WHEN** Super Admin submits new admin form (email, role)
- **THEN** system creates admin account and logs the action

#### Scenario: Super Admin deactivates admin
- **WHEN** Super Admin deactivates an admin account
- **THEN** system disables admin access and logs the action

#### Scenario: Non-Super Admin cannot access
- **WHEN** regular Admin navigates to `/admin/users`
- **THEN** system redirects to dashboard

### Requirement: Admin Audit Log
The system SHALL log all admin actions and provide a queryable audit trail.

#### Scenario: Log admin action
- **WHEN** admin performs any action (validate payment, confirm friendship, etc.)
- **THEN** system creates EventLog entry with admin_id, action, entity, entity_id, metadata, timestamp

#### Scenario: View audit log
- **WHEN** admin navigates to `/admin/audit`
- **THEN** system displays log entries ordered by timestamp DESC with entity and action filters

#### Scenario: Filter audit log
- **WHEN** admin selects entity or action filter
- **THEN** system displays only matching log entries
