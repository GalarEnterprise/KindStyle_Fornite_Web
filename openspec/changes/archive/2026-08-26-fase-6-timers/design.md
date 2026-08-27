## Context

The bots-friendship system (fase-5-bots) is complete. Bots are assigned to users, friendship requests are tracked, and admin can confirm friendships. The timers spec exists but hasn't been implemented yet. We need to add timer calculation, BullMQ delayed jobs, worker processing, and frontend countdown.

Key constraints:
- PostgreSQL is source of truth for timer state (not Redis/browser)
- Each bot has independent timer (no global timer)
- Adding new bots must NOT reset existing timers
- Frontend only displays; backend determines eligibility

## Goals / Non-Goals

**Goals:**
- Calculate eligibility_at on friendship confirmation
- Schedule BullMQ delayed jobs for each timer
- Process timer completions in worker
- Display countdown in user's bot panel
- Recover failed timers on restart

**Non-Goals:**
- Pause/resume timers (they run to completion)
- Timer reset when adding new bots
- Auto-fulfillment on timer completion
- Real-time WebSocket updates (polling suffices for MVP)

## Decisions

### D1: BullMQ delayed jobs over cron polling
**Decision**: Use BullMQ delayed jobs instead of periodic cron checks.
**Rationale**: BullMQ handles scheduling natively with Redis, no need to scan DB every minute. Jobs persist across restarts via Redis.
**Alternatives considered**: Cron job polling DB every minute (wasteful, adds latency), setTimeout (lost on server restart).

### D2: Deterministic job keys
**Decision**: Use `timer:{botId}:{requestId}` as job key.
**Rationale**: Prevents duplicate timers for same bot-request pair. If admin accidentally confirms twice, second attempt is idempotent.
**Alternatives considered**: Auto-generated IDs (allow duplicates), Redis SETNX (complex).

### D3: Frontend polling over WebSocket
**Decision**: Poll timer status every 30 seconds, use setInterval for countdown display.
**Rationale**: WebSocket infrastructure not yet in place. Polling is simpler for MVP. Countdown is cosmetic; 30s delay acceptable.
**Alternatives considered**: WebSocket (more complex, premature), Server-Sent Events (one-directional, not needed).

### D4: Timer state in PostgreSQL only
**Decision**: Store timer state in `friendship_request_bots` table, not Redis.
**Rationale**: PostgreSQL is source of truth. Redis only holds job scheduling metadata. If Redis crashes, timers recover from DB.
**Alternatives considered**: Redis-only timers (data loss risk), dual-write (complex).

## Risks / Trade-offs

- **Redis crash**: Jobs lost but timers recover from DB on worker restart → Mitigated by recovery mechanism
- **Clock skew**: eligibility_at uses server time, not client → Acceptable for MVP
- **Race condition**: Multiple confirms for same bot → Deterministic job keys prevent duplicates
- **Performance**: Polling adds DB load → Acceptable with 30s interval, < 100 concurrent users

## Migration Plan

1. Deploy worker with timer processing logic
2. No schema changes needed (eligibility_at already exists)
3. Test with single bot friendship confirmation
4. Monitor BullMQ dashboard for job scheduling
5. Rollback: Disable timer worker, timers remain in DB but don't process

## Open Questions

_(none — all decisions resolved)_
