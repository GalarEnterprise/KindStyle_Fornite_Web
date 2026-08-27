# Fase 6 — Individual Timers — Tasks

## 1. Timer Service (Backend Core)

- [x] 1.1 Create `packages/shared/src/services/timer-service.ts` with `calculateEligibilityAt()` function that computes `friendship_confirmed_at + configured_period` and verify with unit test
- [x] 1.2 Add `startTimer(botId, requestId)` function that calculates eligibility_at, persists to DB, and enqueues BullMQ delayed job; verify job appears in Redis with correct delay
- [x] 1.3 Add `getEligibilityStatus(friendshipRequestId)` function that queries eligible bots; verify returns only bots with `eligibility_at <= NOW()` and `friendship_status = 'ACCEPTED'`

## 2. BullMQ Worker

- [x] 2.1 Create `workers/timer-worker.ts` with processor for `timers` queue that handles `BOT_TIMER_COMPLETED` events; verify worker starts and connects to Redis
- [x] 2.2 Implement job key generation (`timer:{botId}:{requestId}`) to prevent duplicate timers; verify idempotent behavior with duplicate confirmations
- [x] 2.3 Add error handling with exponential backoff (3 retries, 1s/2s/4s delays); verify failed jobs retry and log to EventLog

## 3. Timer Recovery

- [x] 3.1 Add recovery function that scans for bots with `eligibility_at <= NOW()` and uncompleted timers on worker startup; verify recovery processes stale timers
- [x] 3.2 Integrate recovery into worker initialization; verify timers recover after simulated server restart

## 4. API Endpoints

- [x] 4.1 Create `GET /api/friendship/[id]/timers` endpoint that returns timer status per bot; verify response includes `eligibility_at`, `remaining_seconds`, and `is_eligible` fields
- [x] 4.2 Add Zod validation for request params; verify invalid IDs return 400

## 5. Frontend Countdown Component

- [x] 5.1 Create `apps/web/src/components/bots/countdown-timer.tsx` that displays remaining time as "Xh Ym" and updates every second; verify countdown decrements correctly
- [x] 5.2 Create `apps/web/src/hooks/use-countdown.ts` hook that calculates remaining time from `eligibility_at`; verify hook returns correct remaining seconds
- [x] 5.3 Integrate CountdownTimer into bot panel; verify timer displays for active timers and "Elegible" when complete

## 6. Notifications

- [x] 6.1 Add timer start notification (web) when friendship confirmed; verify notification appears in user's notification center
- [x] 6.2 Add timer complete notification (web + email) when eligibility reached; verify email sent via Resend

## 7. Integration & Polish

- [x] 7.1 Hook timer start into `friendship-service.ts` `confirmFriendship()` function; verify timer starts automatically on admin confirmation
- [x] 7.2 Add loading states and error boundaries for countdown component; verify graceful handling of API failures
- [x] 7.3 Write integration test for full timer lifecycle (confirm → start → wait → complete → eligible); verify end-to-end flow works
