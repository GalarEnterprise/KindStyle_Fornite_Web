## Why

The admin panel currently only has a payments page. The admin spec defines Dashboard, Requests, Friendships, Bots, Settings, Users, and Audit Log — none of which have UI pages. Admins need a complete operational interface to manage the store. fase-9 builds the remaining admin pages.

## What Changes

- **Dashboard**: Metrics overview (orders, revenue, pending validations, active bots, friendship status)
- **Requests Panel**: List, filter, and manage all customer requests with status transitions
- **Friendships Panel**: Priority queue view with timer status, bulk actions (send, mark sent, confirm)
- **Bots Panel**: CRUD for fulfillment bots, capacity management, activation/deactivation
- **Settings Panel**: Configure V-Buck ratio, friendship period, WhatsApp number, catalog sync
- **Users Panel**: Super Admin only — manage admin accounts, create/deactivate admins
- **Audit Log**: View all admin actions with filters (entity, action, date range)
- **Admin API routes**: Dashboard metrics, settings CRUD, user management, audit log queries

## Capabilities

### New Capabilities

None — all capabilities already exist in `openspec/specs/admin/spec.md`

### Modified Capabilities

- `admin/spec`: Add formal requirements with scenarios for Dashboard, Requests Panel, Friendships Panel, Bots Panel, Settings Panel, Users Panel, Audit Log — currently has prose descriptions but no formal requirement structure

## Impact

- **New files**: `apps/web/src/app/(admin)/admin/dashboard/page.tsx`, `requests/page.tsx`, `friendships/page.tsx`, `bots/page.tsx`, `settings/page.tsx`, `users/page.tsx`, `audit/page.tsx`
- **New API routes**: `GET /api/admin/dashboard`, `GET/PUT /api/admin/settings`, `GET/POST/DELETE /api/admin/users`, `GET /api/admin/audit`
- **Modified files**: `openspec/specs/admin/spec.md` (add formal requirements)
- **Dependencies**: No new packages
- **Database**: No schema changes — EventLog model already exists for audit
