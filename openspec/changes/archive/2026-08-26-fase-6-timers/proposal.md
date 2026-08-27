# Fase 6 — Individual Timers

## Why

When a bot's friendship is confirmed, users must wait a configurable cooldown period (default 48h) before the bot becomes eligible for gifting. Without individual timers, there's no way to track when each bot becomes available, causing confusion and manual tracking overhead. This phase implements backend-driven eligibility tracking and frontend countdown display.

## What Changes

- **Timer Calculation Service**: Backend computes `eligibility_at = friendship_confirmed_at + configured_period` per bot
- **BullMQ Delayed Jobs**: Schedule timer-completion events at `eligibility_at` for each bot
- **Timer Worker**: Processes completed timers, updates bot status, triggers notifications
- **Frontend Countdown Component**: Visual countdown showing remaining time per bot (updates every second)
- **Eligibility Query**: SQL filter to find bots where `eligibility_at <= NOW()`
- **Recovery Mechanism**: Periodic checker to reschedule failed/crashed timer jobs
- **Notifications**: Web + email alerts when timer starts and when it completes

## Non-Goals

- Global timer (each bot has its own independent timer)
- Timer pause/resume (timers run to completion once started)
- Timer reset when adding new bots (existing timers preserved)
- Auto-fulfillment on timer completion (manual admin action only)

## Capabilities

### Modified Capabilities

- `timers`: Implement the timer architecture defined in the existing spec (BullMQ jobs, worker, countdown, eligibility query, recovery, notifications)

### New Capabilities

_(none — timers spec already exists)_

## Impact

- **Backend**: New `timer-service.ts`, new BullMQ worker in `workers/`, Prisma schema already has `eligibility_at` field
- **Frontend**: New `CountdownTimer` component, `use-countdown` hook, updates to `BotsPanel` to display timers
- **Queue**: New `timers` BullMQ queue with delayed jobs
- **Dependencies**: `bullmq` already in package.json; no new packages needed
- **API**: New endpoints for timer status per bot
