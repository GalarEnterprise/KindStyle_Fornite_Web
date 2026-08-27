## Context

The request system (fase-4-requests) creates pending orders. The payments spec exists but hasn't been implemented. We need to add manual payment via bank transfer/OXXO, receipt upload, admin validation, and notifications. No online payment gateway in MVP.

Key constraints:
- Manual only: transfer + OXXO deposit
- No partial payments: full cart amount required
- Receipt mandatory: no validation without receipt
- Encrypted credentials: visible to admin only after payment validated

## Goals / Non-Goals

**Goals:**
- Display pending orders with total amount
- Support transfer + OXXO payment methods
- Upload and store receipt images (jpg/png/webp)
- Admin validate/reject with notes
- Notifications on status changes
- Post-payment WhatsApp popup
- Credential access control based on payment status

**Non-Goals:**
- Online payment gateway
- Partial payments
- Automatic payment detection
- Multi-currency (MXN only)

## Decisions

### D1: Local file storage over S3
**Decision**: Store receipt files locally in `uploads/receipts/` for MVP.
**Rationale**: Simpler for MVP, no cloud costs. S3 migration later when needed.
**Alternatives considered**: S3 (premature for MVP), base64 in DB (bloat).

### D2: Payment record per request
**Decision**: One payment record per request (not per cart item).
**Rationale**: Customer pays total for all items in a request, not per item.
**Alternatives considered**: Per-item payments (complex, not needed).

### D3: Status machine for payments
**Decision**: PENDING_RECEIPT → VALIDATION_IN_PROGRESS → VALIDATED | REJECTED.
**Rationale**: Simple linear flow matches manual process. Rejection can be retried.
**Alternatives considered**: More states (EXPIRED, REFUNDED) - not needed for MVP.

### D4: Credential reveal after validation
**Decision**: Decrypt credentials only when payment validated, never before.
**Rationale**: Security requirement - admin cannot access account credentials until payment confirmed.
**Alternatives considered**: Time-based reveal (complex), admin override (security risk).

## Risks / Trade-offs

- **File storage**: Local storage lost on server restart → Mitigated by backup strategy later
- **Large receipts**: >5MB files slow upload → Mitigated by client-side validation
- **Admin workload**: Manual validation scales poorly → Acceptable for MVP, <100 orders/day
- **Receipt fraud**: Fake receipts possible → Admin manual review required

## Migration Plan

1. Create `uploads/receipts/` directory
2. No schema changes needed (payments table already defined)
3. Test with single payment flow
4. Monitor storage usage
5. Rollback: Disable upload endpoint, payments stay in DB

## Open Questions

_(none — all decisions resolved)_
