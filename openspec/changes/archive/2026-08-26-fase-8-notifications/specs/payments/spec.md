## MODIFIED Requirements

### Requirement: Payment Notifications
The system SHALL send notifications on payment status changes via the centralized notification service.

#### Scenario: Receipt uploaded notification
- **WHEN** user uploads receipt
- **THEN** system sends web + email notification: "Comprobante recibido. Validación en proceso." via notification service

#### Scenario: Payment validated notification
- **WHEN** admin validates payment
- **THEN** system sends web + email + WhatsApp notification: "Pago confirmado" with details via notification service

#### Scenario: Payment rejected notification
- **WHEN** admin rejects payment
- **THEN** system sends web + email + WhatsApp notification: "Pago no válido" with reason via notification service
