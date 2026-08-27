## 1. Shared Components

- [x] 1.1 Create `apps/web/src/components/admin/admin-data-table.tsx` — reusable table with sorting, filtering, pagination — verify: component renders with mock data
- [x] 1.2 Create `apps/web/src/components/admin/admin-page-header.tsx` — page title + description component — verify: component renders correctly

## 2. Dashboard

- [x] 2.1 Create `GET /api/admin/dashboard` endpoint returning metrics (orders, revenue, pending validations, friendships, bots) — verify: returns JSON with all metric fields
- [x] 2.2 Create `apps/web/src/app/(admin)/admin/dashboard/page.tsx` — dashboard page with metric cards — verify: page renders with metric placeholders
- [x] 2.3 Add SWR polling (30s) for dashboard metrics — verify: metrics update without page refresh
- [x] 2.4 Write dashboard API tests — verify: `npx vitest run` passes

## 3. Requests Panel

- [x] 3.1 Create `GET /api/admin/requests` endpoint with status filter and pagination — verify: returns filtered paginated requests
- [x] 3.2 Create `apps/web/src/app/(admin)/admin/requests/page.tsx` — requests list with status filter tabs — verify: page renders with filter tabs for each status
- [x] 3.3 Add request detail view with client info, products, friendship status — verify: clicking a request shows full detail
- [x] 3.4 Add copy-to-clipboard for request ID — verify: clicking copy button copies request number
- [x] 3.5 Write requests API tests — verify: `npx vitest run` passes

## 4. Friendships Panel

- [x] 4.1 Create `GET /api/admin/friendships` endpoint with priority ordering (eligibility_at ASC, created_at ASC, unprocessed first) — verify: returns correctly ordered list
- [x] 4.2 Create `apps/web/src/app/(admin)/admin/friendships/page.tsx` — friendships queue with priority display — verify: page renders with priority-ordered list
- [x] 4.3 Add friendship detail view with bot statuses and timer countdowns — verify: clicking a friendship shows bot details
- [x] 4.4 Add action buttons: ENVIAR SOLICITUD, MARCAR ENVIADA, CONFIRMAR AMISTAD — verify: each button triggers correct status transition
- [x] 4.5 Write friendships API tests — verify: `npx vitest run` passes

## 5. Bots Panel

- [x] 5.1 Create `GET /api/admin/bots` endpoint with assignments — verify: returns bots with current assignments
- [x] 5.2 Create `POST /api/admin/bots` endpoint for creating new bots — verify: creates bot and returns it
- [x] 5.3 Create `PUT /api/admin/bots/[id]` endpoint for updating bots — verify: updates bot and returns it
- [x] 5.4 Create `apps/web/src/app/(admin)/admin/bots/page.tsx` — bots list with add/edit/deactivate — verify: page renders with bot list
- [x] 5.5 Add bot form for create/edit with validation — verify: form validates required fields
- [x] 5.6 Write bots API tests — verify: `npx vitest run` passes

## 6. Settings Panel

- [x] 6.1 Create `GET /api/admin/settings` endpoint — verify: returns current settings
- [x] 6.2 Create `PUT /api/admin/settings` endpoint — verify: updates settings and returns them
- [x] 6.3 Create `apps/web/src/app/(admin)/admin/settings/page.tsx` — settings form with V-Buck ratio, friendship period, WhatsApp number — verify: page renders with current values
- [x] 6.4 Add form submission with optimistic update — verify: changes persist on reload
- [x] 6.5 Write settings API tests — verify: `npx vitest run` passes

## 7. Users Panel (Super Admin)

- [x] 7.1 Create `GET /api/admin/users` endpoint (Super Admin only) — verify: returns admin list for Super Admin, 403 for others
- [x] 7.2 Create `POST /api/admin/users` endpoint (Super Admin only) — verify: creates admin account
- [x] 7.3 Create `DELETE /api/admin/users/[id]` endpoint (Super Admin only) — verify: deactivates admin
- [x] 7.4 Create `apps/web/src/app/(admin)/admin/users/page.tsx` — admin list with create/deactivate — verify: page renders for Super Admin, redirects for others
- [x] 7.5 Write users API tests — verify: `npx vitest run` passes

## 8. Audit Log

- [x] 8.1 Create `GET /api/admin/audit` endpoint with entity/action/date filters — verify: returns filtered audit entries
- [x] 8.2 Create `apps/web/src/app/(admin)/admin/audit/page.tsx` — audit log with filters — verify: page renders with filter controls
- [x] 8.3 Write audit API tests — verify: `npx vitest run` passes

## 9. Admin Navigation

- [x] 9.1 Update admin sidebar/navigation to include all new pages — verify: all pages accessible from navigation
- [x] 9.2 Add active state highlighting for current page — verify: current page highlighted in nav

## 10. Testing & Polish

- [x] 10.1 Write integration tests for admin workflows (dashboard load, request filter, friendship action) — verify: `npx vitest run` passes
- [x] 10.2 Run `npm run typecheck` and `npm run lint` — verify: 0 TypeScript errors, no new lint warnings
