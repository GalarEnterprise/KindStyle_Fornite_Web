## Context

The admin panel currently has only a payments page at `/admin/payments`. The admin spec defines 7 routes but only 1 has a UI page. Existing admin API routes exist for friendships and bots (from fase-5). The admin layout and auth middleware are already in place.

## Goals / Non-Goals

**Goals:**
- Dashboard with real-time metrics
- Requests panel with list, filter, detail view
- Friendships panel with priority queue and bulk actions
- Bots panel with CRUD operations
- Settings panel for global configuration
- Users panel (Super Admin only) for admin management
- Audit log with queryable trail

**Non-Goals:**
- Real-time WebSocket updates for dashboard (use SWR polling)
- Advanced analytics/charts (MVP uses simple counters)
- Admin user activity tracking (only action logging)
- Bulk import/export of admin data

## Decisions

### 1. Dashboard Metrics via Single API Endpoint

**Decision**: Single `GET /api/admin/dashboard` endpoint returns all metrics in one response.

**Rationale**: Reduces HTTP requests from 7+ to 1. Dashboard loads once, metrics refresh via SWR polling (30s). No need for separate endpoints per metric.

**Alternatives considered**:
- Separate endpoints per metric — rejected: increases requests, no benefit for MVP
- WebSocket for real-time — rejected: over-engineering, 30s polling sufficient

### 2. Shared Admin Table Component

**Decision**: Create a reusable `AdminDataTable` component with sorting, filtering, pagination.

**Rationale**: Requests, friendships, bots, and audit log all need table views with similar features. Reuse reduces duplication.

**Alternatives considered**:
- Separate table components per page — rejected: code duplication
- Third-party table library — rejected: adds dependency, custom solution sufficient

### 3. Settings via Environment + Database Hybrid

**Decision**: Settings stored in database, loaded on startup, cached in memory. Admin updates persist to DB and refresh cache.

**Rationale**: Settings need to be admin-configurable (not env vars) but must be fast to read. In-memory cache avoids DB hit on every price calculation.

**Alternatives considered**:
- Pure env vars — rejected: requires redeploy to change settings
- Pure DB with no cache — rejected: adds latency to every request

### 4. Audit Log via EventLog Model

**Decision**: Reuse existing `EventLog` model for admin audit trail. Admin actions already log to EventLog; just need a query UI.

**Rationale**: No schema changes needed. EventLog already captures entity, action, metadata, timestamp.

**Alternatives considered**:
- Separate AuditLog model — rejected: duplicates EventLog functionality

### 5. Users Panel Restricted by Middleware

**Decision**: `/admin/users` route checks `role === 'SUPER_ADMIN'` in page component. Redirect if not authorized.

**Rationale**: Simplest approach for MVP. Middleware-level protection can be added later.

**Alternatives considered**:
- Next.js middleware route protection — rejected: requires more complex middleware setup
- API-level only restriction — rejected: UI should hide the link entirely

## Risks / Trade-offs

- **[Dashboard performance]** → Mitigation: Use database indexes on common query fields (created_at, status). Cache metrics in Redis if query times become slow.
- **[Settings cache consistency]** → Mitigation: Invalidate cache on admin update. Accept brief inconsistency window.
- **[Audit log volume]** → Mitigation: EventLog already indexed. Can add date-based partitioning later if volume grows.
- **[User management security]** → Mitigation: Double-check role in both API and UI. Log all admin management actions.

## Migration Plan

1. Create dashboard API and page
2. Create requests panel (API + page)
3. Create friendships panel (extend existing API + page)
4. Create bots panel (extend existing API + page)
5. Create settings panel (API + page)
6. Create users panel (API + page, Super Admin only)
7. Create audit log page (query existing EventLog)
8. No database migration needed

## Open Questions

- Should dashboard metrics include revenue in multiple currencies or just MXN? (Recommendation: MXN only for MVP, currency conversion is fase-10)
