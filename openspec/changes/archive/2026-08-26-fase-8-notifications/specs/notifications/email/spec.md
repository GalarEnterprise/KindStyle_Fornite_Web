## Purpose

Email notification delivery via Resend with HTML templates for each event type.

## ADDED Requirements

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
