# Fase 7 — Pagos Manuales

## Why

After the request is created and priced, the customer needs a way to pay. Without a payment system, the store cannot complete transactions. This phase implements manual payment via bank transfer and OXXO deposit, with admin validation and receipt upload.

## What Changes

- **Payment Page**: Customer sees pending orders, selects payment method, copies bank details, uploads receipt
- **Receipt Upload**: jpg/png/webp upload to storage, with validation
- **Payment Status Tracker**: Visual timeline showing current state (uploaded → reviewing → validated/rejected)
- **Admin Validation Panel**: List pending payments, download receipts, validate/reject with notes
- **Notifications**: Web + email on receipt upload, validation, and rejection
- **Post-Payment Popup**: Optional WhatsApp number collection after payment
- **Credential Access Control**: Encrypted credentials visible to admin only after payment validated

## Non-Goals

- Online payment gateway (MVP uses manual transfer/OXXO only)
- Partial payments (full cart amount required)
- Automatic payment detection
- Multi-currency support (MXN only for payments)

## Capabilities

### Modified Capabilities

- `payments`: Implement the manual payment system with receipt upload, admin validation, notifications, and credential access control

### New Capabilities

_(none — payments spec already exists)_

## Impact

- **Backend**: New `payment-service.ts`, API routes for payment CRUD and receipt upload, BullMQ job for validation notifications
- **Frontend**: New `/account/payment` page, `PaymentTracker` component, admin `/admin/payments` panel, post-payment WhatsApp popup
- **Storage**: File storage for receipt images (local for MVP, S3 later)
- **Dependencies**: No new packages; uses existing Prisma, BullMQ, Resend
