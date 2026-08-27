## ADDED Requirements

### Requirement: Payment Page Display
The system SHALL display a payment page showing all pending orders for the authenticated user.

#### Scenario: User views pending orders
- **WHEN** user navigates to `/account/payment`
- **THEN** system displays list of pending requests with item details, subtotals, and total amount

#### Scenario: User has no pending orders
- **WHEN** user navigates to `/account/payment` with no pending requests
- **THEN** system displays "No hay pedidos pendientes" message

### Requirement: Payment Method Selection
The system SHALL allow user to select payment method (Transferencia or OXXO).

#### Scenario: Method selection
- **WHEN** user selects a payment method
- **THEN** system displays corresponding bank/account details with copy button

#### Scenario: Copy bank details
- **WHEN** user clicks "COPIAR DATOS"
- **THEN** system copies bank/account details to clipboard and shows confirmation

### Requirement: Receipt Upload
The system SHALL allow user to upload payment receipt after selecting method.

#### Scenario: Upload receipt
- **WHEN** user clicks "VALIDAR PAGO" and uploads a file (jpg/png/webp)
- **THEN** system stores receipt, creates payment record with status `PENDING_RECEIPT`, and sends notification

#### Scenario: Invalid file format
- **WHEN** user uploads a file that is not jpg/png/webp
- **THEN** system rejects upload with error message

#### Scenario: File too large
- **WHEN** user uploads a file larger than 5MB
- **THEN** system rejects upload with error message

### Requirement: Payment Status Tracker
The system SHALL display a visual tracker showing current payment status.

#### Scenario: Tracker display
- **WHEN** payment is in progress
- **THEN** system shows timeline: Comprobante subido → En revisión → Validado/Rechazado

### Requirement: Admin Payment Validation
The system SHALL allow admins to view, validate, or reject payments.

#### Scenario: Admin views pending payments
- **WHEN** admin navigates to `/admin/payments`
- **THEN** system displays list of pending payments with receipt download

#### Scenario: Admin validates payment
- **WHEN** admin clicks "VALIDAR" on a payment
- **THEN** system updates status to `VALIDATED`, logs event, and sends notification

#### Scenario: Admin rejects payment
- **WHEN** admin clicks "RECHAZAR" with reason note
- **THEN** system updates status to `REJECTED`, logs event, and sends notification with reason

### Requirement: Payment Notifications
The system SHALL send notifications on payment status changes.

#### Scenario: Receipt uploaded notification
- **WHEN** user uploads receipt
- **THEN** system sends web notification: "Comprobante recibido. Validación en proceso."

#### Scenario: Payment validated notification
- **WHEN** admin validates payment
- **THEN** system sends web + email notification: "Pago confirmado" with details

#### Scenario: Payment rejected notification
- **WHEN** admin rejects payment
- **THEN** system sends web + email notification: "Pago no válido" with reason

### Requirement: Post-Payment WhatsApp Popup
The system SHALL show optional WhatsApp number collection after payment.

#### Scenario: Popup shown to user without phone
- **WHEN** payment is completed and user has no phone number
- **THEN** system displays popup asking for WhatsApp number

#### Scenario: User provides number
- **WHEN** user enters number and clicks "Guardar"
- **THEN** system saves number to user profile

#### Scenario: User skips popup
- **WHEN** user clicks "Omitir"
- **THEN** system closes popup without saving

### Requirement: Credential Access Control
The system SHALL control access to encrypted credentials based on payment status.

#### Scenario: Credentials hidden before payment
- **WHEN** request has encrypted credentials and payment is not validated
- **THEN** admin cannot view credentials

#### Scenario: Credentials visible after payment
- **WHEN** payment is validated
- **THEN** admin can view decrypted credentials for fulfillment
