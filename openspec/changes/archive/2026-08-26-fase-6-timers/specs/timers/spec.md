## ADDED Requirements

### Requirement: Timer Calculation Service
The system SHALL calculate `eligibility_at` as `friendship_confirmed_at + configured_friendship_period` for each bot when friendship is confirmed.

#### Scenario: Timer starts on friendship confirmation
- **WHEN** admin confirms friendship for a bot (`FRIENDSHIP_CONFIRMED` event)
- **THEN** system sets `eligibility_at = NOW() + configured_friendship_period` and persists to database

#### Scenario: Timer uses configurable period
- **WHEN** friendship period is configured (default: 48h)
- **THEN** system uses the configured value, NOT a hardcoded constant

### Requirement: BullMQ Delayed Jobs
The system SHALL schedule a BullMQ delayed job at `eligibility_at` for each bot timer.

#### Scenario: Job scheduled on timer start
- **WHEN** timer calculation completes successfully
- **THEN** system enqueues a delayed job to `timers` queue with delay = `eligibility_at - NOW()` in milliseconds

#### Scenario: Job ID is deterministic
- **WHEN** multiple timer starts occur for the same bot
- **THEN** system uses bot ID + request ID as job key to prevent duplicate timers

### Requirement: Timer Worker
The system SHALL process completed timer jobs to mark bots as eligible.

#### Scenario: Timer completion
- **WHEN** delayed job fires
- **THEN** worker updates `friendship_request_bots` row, logs `BOT_TIMER_COMPLETED` event, and triggers notifications

#### Scenario: Worker handles errors gracefully
- **WHEN** timer job fails (e.g., database timeout)
- **THEN** worker retries with exponential backoff and logs error to EventLog

### Requirement: Eligibility Query
The system SHALL provide a query to find all eligible bots for a given friendship request.

#### Scenario: Query returns eligible bots
- **WHEN** client requests bot eligibility status
- **THEN** system returns bots where `friendship_status = 'ACCEPTED'` AND `eligibility_at <= NOW()` AND bot `status = 'ACTIVE'`

### Requirement: Timer Recovery
The system SHALL recover failed timer jobs on server restart.

#### Scenario: Recovery on startup
- **WHEN** worker process starts
- **THEN** system scans for bots with `eligibility_at <= NOW()` and `friendship_status = 'ACCEPTED'` that haven't completed timer, and re-processes them

### Requirement: Frontend Countdown Display
The system SHALL display a countdown timer for each bot showing remaining time.

#### Scenario: Countdown shows remaining time
- **WHEN** bot has active timer (eligibility_at in the future)
- **THEN** frontend displays countdown as "Xh Ym restantes" updating every second

#### Scenario: Countdown completes
- **WHEN** eligibility_at is reached
- **THEN** frontend shows "Elegible" status without requiring page refresh

### Requirement: Timer Notifications
The system SHALL send notifications when timer starts and completes.

#### Scenario: Timer start notification
- **WHEN** timer starts (friendship confirmed)
- **THEN** system sends web notification: "Bot {name} preparado. Período de espera iniciado."

#### Scenario: Timer complete notification
- **WHEN** timer completes (eligibility reached)
- **THEN** system sends web + email notification: "Bot {name} elegible para enviarte regalos."
