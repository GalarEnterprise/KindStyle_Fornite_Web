## Purpose

WhatsApp notification delivery via wa.me links with pre-filled messages.

## ADDED Requirements

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
