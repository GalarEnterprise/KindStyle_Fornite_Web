# Fase 7 — Pagos Manuales — Tasks

## 1. Payment Service (Backend Core)

- [x] 1.1 Create `apps/web/src/lib/services/payment/payment-service.ts` with `createPayment()` function that creates payment record from request; verify with unit test
- [x] 1.2 Add `uploadReceipt(paymentId, file)` function that validates file type/size, stores locally, and updates payment record; verify file saved and record updated
- [x] 1.3 Add `validatePayment(paymentId, adminId)` function that updates status to VALIDATED, logs event, and triggers notification; verify status change and notification
- [x] 1.4 Add `rejectPayment(paymentId, adminId, reason)` function that updates status to REJECTED with reason; verify status change and notification

## 2. API Endpoints

- [x] 2.1 Create `GET /api/payment` endpoint that returns pending payments for authenticated user; verify response includes request details and total
- [x] 2.2 Create `POST /api/payment/[id]/receipt` endpoint for receipt upload with file validation; verify file stored and payment status updated
- [x] 2.3 Create `GET /api/admin/payments` endpoint that returns all pending payments for admin; verify response includes receipt URLs
- [x] 2.4 Create `POST /api/admin/payments/[id]/validate` endpoint for admin validation; verify status change and notification
- [x] 2.5 Create `POST /api/admin/payments/[id]/reject` endpoint with reason; verify status change and notification with reason

## 3. Frontend - Payment Page

- [x] 3.1 Create `apps/web/src/app/(public)/account/payment/page.tsx` that displays pending orders with total; verify page renders correctly
- [x] 3.2 Create `PaymentMethodSelector` component with Transferencia/OXXO options; verify selection shows correct bank details
- [x] 3.3 Create `ReceiptUploader` component with drag-and-drop, file validation (type/size), and upload; verify file uploaded and status updated

## 4. Frontend - Status Tracker

- [x] 4.1 Create `PaymentTracker` component with visual timeline (uploaded → reviewing → validated/rejected); verify tracker displays correct state
- [x] 4.2 Integrate tracker into payment page; verify tracker updates after upload

## 5. Admin Panel

- [x] 5.1 Create `apps/web/src/app/(admin)/admin/payments/page.tsx` with list of pending payments; verify page renders correctly
- [x] 5.2 Create `AdminPaymentDetail` component with receipt download, validate/reject buttons; verify actions work
- [x] 5.3 Add reject modal with reason input; verify rejection with reason saved

## 6. Notifications

- [x] 6.1 Add receipt uploaded notification (web) when user uploads receipt; verify notification appears
- [x] 6.2 Add payment validated notification (web + email); verify email sent via Resend
- [x] 6.3 Add payment rejected notification (web + email) with reason; verify email includes reason

## 7. Post-Payment Popup

- [x] 7.1 Create `WhatsAppPopup` component that shows after payment if user has no phone; verify popup displays correctly
- [x] 7.2 Add phone number save to user profile; verify number saved
- [x] 7.3 Add skip functionality; verify popup closes without saving

## 8. Credential Access Control

- [x] 8.1 Add credential visibility check based on payment status in admin detail view; verify credentials hidden before validation
- [x] 8.2 Add credential decryption after payment validated; verify credentials visible to admin

## 9. Integration & Polish

- [x] 9.1 Hook payment creation into request flow; verify payment record created when request submitted
- [x] 9.2 Add loading states and error handling for all components; verify graceful error handling
- [x] 9.3 Write integration test for full payment lifecycle (create → upload → validate → credentials visible); verify end-to-end flow works
