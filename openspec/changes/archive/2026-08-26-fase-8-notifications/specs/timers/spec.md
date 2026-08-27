## MODIFIED Requirements

### Requirement: Timer Notifications
The system SHALL send notifications when timer starts and completes via the centralized notification service.

#### Scenario: Timer start notification
- **WHEN** timer starts (friendship confirmed)
- **THEN** system sends web + email notification: "Bot {name} preparado. Período de espera iniciado." via notification service

#### Scenario: Timer complete notification
- **WHEN** timer completes (eligibility reached)
- **THEN** system sends web + email + WhatsApp notification: "Bot {name} elegible para enviarte regalos." via notification service
