# Cartly — Technical Requirements Document (TRD)

**Version:** 1.0  
**Status:** Approved for planning  
**Last updated:** 2026-11-21  
**Related documents:** `PRD.md`, `APP-FLOW.md`, `UI-UX-BRIEF.md`, `BACKEND-SCHEMA.md`

---

## 1. Purpose

This TRD specifies **how** Cartly is built: the stack, repository structure, system layers, API contract, security model, data-handling rules, non-functional targets, deployment topology, and test strategy. It implements the features and BR-01 … BR-20 rules defined in `PRD.md` and is constrained by the entity model in `BACKEND-SCHEMA.md`.

It is written so a developer can scaffold the project without further product decisions.

---

## 2. Technical decisions (locked)

| Area | Decision | Rationale |
|---|---|---|
| Language | TypeScript across client and server | Shared contracts, fewer runtime type errors |
| Structure | Two folders: `client/`, `server/` (+ root `prisma/`) | Matches team preference; simple mental model |
| Client | React, Vite, React Router, Tailwind CSS, TanStack Query, React Hook Form, Zod | Fast SPA with typed server cache and validated forms |
| Server | Node.js + Express, Zod middleware, Prisma ORM | Minimal, predictable request pipeline |
| Database | PostgreSQL, managed, pooled connection | Serverless-friendly with Prisma |
| Auth | Access JWT (15 min) + rotating refresh token (7 days) in httpOnly cookie; bcrypt/argon2 hashing | Stateless access tokens with revocable sessions |
| Payments | Mock capture in checkout transaction; no gateway or webhooks | Meets MVP scope without external dependencies |
| Images | Absolute http(s) URL array on product | No storage infrastructure in MVP |
| Money | Integer cents; tax in basis points; half-up rounding | Avoids floating-point drift |
| Deployment | Static SPA + managed Node API + managed Postgres | Matches serverless/managed target |
| Tests | Vitest unit tests + Supertest API integration tests | Covers pricing/status logic and critical paths |

---

## 3. Detailed requirements

### 3.1 Repository structure

```
cartly/
  client/
    src/
      app/            router, providers, guards
      features/       catalog, cart, checkout, orders, auth, admin
      components/     shared UI primitives
      lib/            api client, query keys, formatters, schemas
      styles/         Tailwind entry and design tokens
    index.html
    package.json
    tailwind.config.*
    vite.config.*
  server/
    src/
      routes/         Express routers
      middleware/     auth, role guard, validation, error handler, rate limit
      controllers/    thin request/response adapters
      services/       catalog, cart, pricing, order, admin, auth
      contracts/      Zod schemas shared as the API contract
      db/             Prisma client singleton
      config/         env validation
      tests/          unit and integration suites
    package.json
  prisma/
    schema.prisma
    migrations/
    seed.ts
  docker-compose.yml
  .env.example
  README.md
```

**Rule:** no business logic in controllers or React components beyond presentation; all rules BR-01 … BR-20 live in server services or shared pure functions.

### 3.2 Request pipeline

`Client → /api proxy → Express router → requireAuth / requireAdmin → Zod validate (body, params, query) → controller → service → Prisma → PostgreSQL`

- A single error middleware maps known failures to a consistent envelope:
  `{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": {} } }`
- Standard HTTP codes: 400 validation, 401 unauthenticated, 403 wrong role, 404 not found, 409 business conflict (stock, invalid transition), 429 rate limited, 500 unexpected.
- All list endpoints return `{ items, page, limit, total, totalPages }`.
- Timestamps serialise as ISO-8601 UTC.

### 3.3 API contract

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create customer account |
| POST | `/api/auth/login` | — | Issue access token + refresh cookie |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate session |
| POST | `/api/auth/logout` | Refresh cookie | Revoke session |
| GET | `/api/auth/me` | Access token | Current identity and role |
| GET | `/api/health` | — | Liveness and database connectivity (deployment) |
| GET | `/api/products` | — | Search, filter, sort, paginate (BR-01, BR-03) |
| GET | `/api/products/:slug` | — | Product detail (BR-01) |
| POST | `/api/products` | ADMIN | Create product |
| PATCH | `/api/products/:id` | ADMIN | Edit product |
| DELETE | `/api/products/:id` | ADMIN | Soft-delete product (BR-14) |
| GET | `/api/categories` | — | List categories (same list for all roles) |
| POST | `/api/categories` | ADMIN | Create category |
| PATCH | `/api/categories/:id` | ADMIN | Edit category |
| DELETE | `/api/categories/:id` | ADMIN | Delete if unreferenced (BR-14) |
| GET | `/api/settings/shipping` | ADMIN | Read shipping rule |
| PATCH | `/api/settings/shipping` | ADMIN | Update flat fee / free threshold / active |
| GET | `/api/settings/tax` | ADMIN | Read tax rule |
| PATCH | `/api/settings/tax` | ADMIN | Update percentBps / active |
| GET | `/api/cart` | CUSTOMER | Cart with computed totals |
| POST | `/api/cart/items` | CUSTOMER | Add item (BR-04, BR-05) |
| PATCH | `/api/cart/items/:productId` | CUSTOMER | Update quantity (BR-05) |
| DELETE | `/api/cart/items/:productId` | CUSTOMER | Remove item |
| POST | `/api/orders` | CUSTOMER | Checkout with address + idempotency key (BR-06 … BR-10, BR-18) |
| GET | `/api/orders` | CUSTOMER | Own order history (BR-13) |
| GET | `/api/orders/:id` | CUSTOMER | Own order detail with events (BR-13) |
| POST | `/api/orders/:id/cancel` | CUSTOMER | Cancel own eligible order (BR-11, BR-12) |
| GET | `/api/orders/admin` | ADMIN | All orders with status/customer filters |
| GET | `/api/orders/admin/:id` | ADMIN | Admin order detail with events (BR-13) |
| PATCH | `/api/orders/:id/status` | ADMIN | Allowed status transition (BR-11, BR-12) |

Route ordering requirement: `/api/orders/admin` and `/api/orders/admin/:id` must be registered before `/api/orders/:id`.

### 3.4 Service responsibilities

| Service | Responsibility | Rules |
|---|---|---|
| `authService` | Hashing, token issue/rotation/revocation, identity | BR-15, BR-16 |
| `catalogService` | Public/product-admin queries, slug handling, FTS | BR-01, BR-02, BR-03, BR-14 |
| `categoryService` | Category CRUD and reference checks | BR-14 |
| `pricingService` | Pure total calculation from settings; used by cart and checkout | BR-08, BR-09, BR-10, BR-17, BR-19 |
| `cartService` | Cart lifecycle, quantity limits, stock-aware estimates | BR-02, BR-04, BR-05 |
| `orderService` | Checkout transaction, snapshots, status machine, cancellation | BR-06, BR-07, BR-11, BR-12, BR-13, BR-18 |
| `adminService` | Settings updates, admin-scoped listings | BR-09, BR-10, BR-15 |

### 3.5 Critical algorithms

**Checkout transaction (single `prisma.$transaction`)**
1. Validate the idempotency key scoped to the current customer; if already used, return that customer's existing order.
2. Load cart items and lock referenced product rows (`SELECT … FOR UPDATE`).
3. Reject if any product is inactive, soft-deleted, or has `stock < quantity` (BR-06).
4. Re-read price and current settings; compute totals with `pricingService` (BR-02, BR-08).
5. Create `Order` (`PENDING_PAYMENT`) with address/totals snapshot.
6. Create `OrderItem` rows with name, sku, unit price, quantity, line total snapshots.
7. Apply mock capture: write `PAID` and a `SYSTEM` `OrderEvent`.
8. Decrement product stock; assert no negative stock.
9. Clear cart; store idempotency key → order id; commit.

**Status machine (server-side only)**
- `PENDING_PAYMENT` exists only inside the checkout transaction and is never exposed for admin or customer action.
- Transition table is a constant; the API never accepts arbitrary status strings.
- Invalid transition → 409 with allowed next states.
- Cancellation from `PAID` restores stock and appends an `OrderEvent` (BR-12).

**Full-text search**
- Generated `tsvector` column over name + description with a GIN index, created by migration.
- Query uses `websearch_to_tsquery('english', term)`; optional prefix matching on the last token.
- Fall back to all products ordered by newest when the search term is empty.

### 3.6 Security requirements

| Concern | Requirement |
|---|---|
| Password storage | bcrypt cost 12 or argon2id; never logged or returned |
| Transport | HTTPS only in production; HSTS via Helmet |
| Cookies | `httpOnly; Secure; SameSite=Lax; Path=/`; first-party `/api` proxy preferred over cross-site cookies |
| Authorization | `requireAuth` on cart/orders; `requireAdmin` on all admin routes; ownership checks on customer order routes |
| Validation | Zod on every body, query, and param; unknown fields stripped |
| Rate limiting | Auth endpoints (login/register/refresh) and checkout; e.g. 10 requests / minute / IP |
| SQL injection | Prisma parameterised queries only; raw SQL only for the FTS index and lock statement |
| Secrets | Validated at boot from env; never bundled into `client/` |
| Uploads | None in MVP; image URLs validated against http(s) scheme only |
| Error leakage | Production errors return generic codes; details only in development logs |
| Audit | Status changes recorded with actor type and actor id |
| CSRF | Validate `Origin` and `Referer` on every `POST`/`PATCH`/`DELETE`; reject cross-origin mismatches. Keep `SameSite=Lax`, secure cookies, and the same-origin `/api` proxy. |

### 3.7 Environment configuration

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | server, prisma | Pooled PostgreSQL connection |
| `DIRECT_URL` | prisma | Direct connection for migrations |
| `PORT` | server | HTTP port |
| `WEB_ORIGIN` | server | CORS allowlist |
| `JWT_ACCESS_SECRET` | server | Access token signing |
| `JWT_REFRESH_SECRET` | server | Refresh token signing/hash pepper |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | prisma seed | Seeded super-admin (BR-15) |
| `APP_CURRENCY` | client, server | `USD` (BR-19) |
| `NODE_ENV` | all | Logging/error verbosity |

Environment variables are validated at startup; missing required values abort boot with a descriptive error.

### 3.8 Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Catalog listing latency, p95 | < 300 ms |
| NFR-02 | Checkout latency, p95 | < 800 ms |
| NFR-03 | Availability target (managed platform) | 99.5% |
| NFR-04 | Responsive breakpoints | 375 px → 1440 px without horizontal scroll |
| NFR-05 | Accessibility | WCAG 2.1 AA on core flows |
| NFR-06 | Observability | Structured request logs with request id; errors logged with code and stack in non-production |
| NFR-07 | Data integrity | Zero oversold units under concurrent checkout; zero orphaned order items |
| NFR-08 | Browser support | Last 2 versions of Chrome, Firefox, Safari, Edge |
| NFR-09 | Deployment | Migrations run as a deploy step; no runtime schema changes |
| NFR-10 | Backups | Managed Postgres point-in-time recovery enabled |

### 3.9 Deployment requirements

- `client/`: static build, deployed to Vercel/Netlify; SPA fallback routing enabled.
- `server/`: managed Node/Express service or serverless functions; single Prisma client instance reused across invocations.
- Same-origin `/api` rewrite from the web host to the API host so the refresh cookie remains first-party.
- CORS accepts only `WEB_ORIGIN` with credentials enabled if the proxy is not used.
- `prisma migrate deploy` runs in CI/CD before the API release; `prisma db seed` runs once manually for the initial admin.
- Health endpoint `GET /api/health` returns database connectivity status.
- No local filesystem writes; no in-memory session state; no long-lived background jobs in the MVP.

### 3.10 Test requirements

| Layer | Tool | Coverage |
|---|---|---|
| Pure logic | Vitest | `pricingService` total/shipping/tax math, status transition table, Zod schema edge cases |
| API integration | Supertest + test database | auth flows, product CRUD/permissions, cart rules, checkout success/failure/customer-scoped idempotency, cancellation, admin status transitions, admin order detail |
| Concurrency | Supertest + test database | two concurrent checkouts against one remaining unit; exactly one order and no negative stock (NFR-07) |
| Authorization matrix | Supertest | table-driven wrong-role and cross-owner access checks for all 30 endpoints (AC-13) |
| Security | Supertest | CSRF origin mismatch rejection, refresh-token reuse revocation, rate-limit enforcement, idempotency-key reuse by another customer |
| Data lifecycle | Supertest/migrations | migrations apply twice, seed is idempotent, AC-08/AC-09/AC-10 behaviour |
| Manual smoke | Checklist | 375 px and 1440 px flows, keyboard-only navigation, all empty/error states |

Test database is reset between suites. No test may depend on production seed credentials.

---

## 4. Features (technical capabilities)

1. **Typed API contract** — one Zod definition per endpoint, reused for validation and client types.
2. **Role-based access control** — middleware-level enforcement, not UI-only.
3. **Catalog engine** — full-text search, filters, sort, capped pagination, slug detail.
4. **Cart engine** — server-authoritative lines and estimates.
5. **Pricing engine** — pure, unit-tested total calculation from admin settings.
6. **Order engine** — atomic checkout, snapshots, mock capture, idempotency, status machine, audit events.
7. **Admin control plane** — catalog, category, settings, and order management endpoints.
8. **Session management** — rotating refresh tokens with reuse detection.
9. **Consistent errors** — one envelope, documented codes.
10. **Observability** — request ids, structured logs, health check.

---

## 5. User roles (technical enforcement)

| Capability | Guest | Customer | Admin | Enforcement |
|---|---|---|---|---|
| Public catalog reads | Yes | Yes | Yes | No middleware |
| Admin catalog writes | No | No | Yes | `requireAuth` + `requireAdmin` |
| Cart and checkout | No | Yes | No | `requireAuth` + role check |
| Own orders | No | Yes | No | Ownership filter in service |
| All orders | No | No | Yes | `requireAdmin` |
| Status updates | No | No | Yes | `requireAdmin` + transition table |
| Settings updates | No | No | Yes | `requireAdmin` |
| Seed admin creation | — | — | Seed only | No public route |

Admin accounts are produced exclusively by `prisma db seed` (BR-15). Admin sessions use the same auth pipeline as customers; the `role` claim is read from the database, not trusted from the client. Admins browsing public catalog pages do not receive purchase controls; add-to-cart is rendered only for customers.

---

## 6. Business rules → technical enforcement

| Rule | Technical enforcement |
|---|---|
| BR-01 | Query filter `isActive: true, deletedAt: null` in public catalog; admin queries bypass filter |
| BR-02 | Price read from `Product.priceCents` in `pricingService`; client totals ignored |
| BR-03 | `tsvector` + GIN index; server-side filter/sort/pagination; `limit` clamped to 50 |
| BR-04 | `requireAuth`; unique constraint on `(cartId, productId)` |
| BR-05 | Zod `int().min(1).max(99)` plus stock comparison |
| BR-06 | Row lock + stock assertion inside checkout transaction |
| BR-07 | Mock capture step in `orderService`; `PENDING_PAYMENT` internal only; no payment fields accepted |
| BR-08 | `pricingService` pure function with unit tests |
| BR-09 / BR-10 | Singleton settings tables with admin-only PATCH |
| BR-11 | Server-side transition map; `PENDING_PAYMENT` internal only; 409 on invalid input |
| BR-12 | Stock restore + `OrderEvent` insert in the same transaction |
| BR-13 | Ownership predicate on customer queries; immutable order item fields |
| BR-14 | `deletedAt` soft delete; category delete guarded by product count query |
| BR-15 | Seed-only admin; no registration role field accepted |
| BR-16 | bcrypt/argon2, 15m access, 7d rotating refresh, revocation table |
| BR-17 | Zod on all inputs; URL scheme validation; integer cents/basis points |
| BR-18 | Unique `(userId, idempotencyKey)` constraint + transaction row locks |
| BR-19 | Single currency constant and English copy only |
| BR-20 | Features omitted from routes, schema, and UI |

---

## 7. Expected output

This TRD produces:

1. A concrete technology and repository blueprint for `client/`, `server/`, and `prisma/`.
2. A 30-endpoint REST contract with authentication and role requirements.
3. Inventories of services, security controls, environment variables, NFR targets, deployment steps, and test coverage.
4. A direct mapping of every business rule BR-01 … BR-20 to an enforceable technical mechanism.
5. Enough detail to begin milestone 1 (scaffolding, env validation, database, migration, seed, auth) without further architectural decisions.

**No implementation code is produced by this document.**
