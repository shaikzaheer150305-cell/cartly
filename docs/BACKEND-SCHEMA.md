# Cartly — Backend Schema Document

**Version:** 1.0  
**Status:** Approved for planning  
**Last updated:** 2026-11-21  
**Related documents:** `PRD.md`, `TRD.md`, `APP-FLOW.md`, `UI-UX-BRIEF.md`

---

## 1. Purpose

This document is the canonical data model for Cartly. It defines every entity, field, type, constraint, index, relationship, and seed record needed to implement the features and BR-01 … BR-20 rules in `PRD.md`, using the access patterns described in `TRD.md` and `APP-FLOW.md`. It is a design specification, not generated Prisma code.

---

## 2. Modelling principles

### 2.1 Detailed requirements

- Represent all eleven entities in section 5 with the exact field types, defaults, and constraints listed.
- Enforce uniqueness, referential actions, checks, and indexes from section 7 at the database layer where possible.
- Keep order snapshots immutable and append-only for events; no update paths for `OrderItem` or `OrderEvent`.
- Support the role-based access matrix in section 8; services must apply ownership and role predicates on every query.
- Run schema changes through migrations in section 10; no runtime schema mutation.

1. **Server-authoritative values** — prices, stock, and totals are stored/derived server-side; the client never writes them.
2. **Snapshots for history** — order lines copy product name, SKU, and unit price so past orders survive product edits/deletes.
3. **Soft deletion for products** — `deletedAt` hides products without breaking references.
4. **Integer money** — all monetary values are integer cents; tax is basis points (1 % = 100 bps).
5. **Singleton settings** — shipping and tax rules are single rows with fixed ids.
6. **Auditability** — status changes are immutable events, not overwrites.
7. **Least privilege** — the schema supports the role boundaries; services enforce them.

---

## 3. Features supported by the schema

| Feature | Entities involved |
|---|---|
| Customer/admin identity | `User`, `RefreshToken` |
| Product catalog, search, filters | `Product`, `Category`, full-text index |
| Admin catalog management | `Product.deletedAt`, `Product.isActive`, `Category` |
| Cart | `Cart`, `CartItem`, `Product.stock` |
| Pricing rules | `ShippingSettings`, `TaxSettings` |
| Checkout and mock payment | `Order`, `OrderItem`, `OrderEvent`, `Product.stock` |
| Order history and detail | `Order`, `OrderItem`, `OrderEvent` |
| Cancellation and stock restoration | `Order.status`, `OrderEvent`, `Product.stock` |
| Admin order processing | `Order.status`, `OrderEvent` |
| Idempotency | `Order.idempotencyKey` |

---

## 4. Enumerations

| Enum | Values | Used by |
|---|---|---|
| `Role` | `CUSTOMER`, `ADMIN` | `User.role` |
| `OrderStatus` | `PENDING_PAYMENT`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` | `Order.status`, `OrderEvent.fromStatus/toStatus` |
| `ActorType` | `SYSTEM`, `CUSTOMER`, `ADMIN` | `OrderEvent.actorType` |

The status set and allowed transitions are fixed by BR-11; the database stores the value, while the service enforces the transition table. `PENDING_PAYMENT` is an internal-only state used inside the checkout transaction and is never user-visible or admin-actionable.

---

## 5. Entities and fields

### 5.1 `User`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `name` | String | No | — | 1–80 chars |
| `email` | String | No | — | Unique; normalised lowercase at service layer |
| `passwordHash` | String | No | — | bcrypt/argon2 hash; never returned by APIs |
| `role` | Role | No | `CUSTOMER` | Admin only via seed (BR-15) |
| `createdAt` | DateTime (UTC) | No | now | |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

**Relations:** one `Cart`, many `Order`, many `RefreshToken`.

### 5.2 `RefreshToken`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `userId` | String | No | — | FK → `User.id`, `ON DELETE CASCADE` |
| `tokenHash` | String | No | — | Unique; hash of the refresh token (BR-16) |
| `expiresAt` | DateTime (UTC) | No | — | 7 days from issue |
| `revokedAt` | DateTime (UTC) | Yes | null | Set on logout or reuse detection |
| `createdAt` | DateTime (UTC) | No | now | |

**Relations:** many-to-one `User`. Access tokens are stateless and not stored.

### 5.3 `Category`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `name` | String | No | — | Unique, 1–80 chars |
| `slug` | String | No | — | Unique, URL-safe |
| `description` | String | Yes | null | Optional text |
| `createdAt` | DateTime (UTC) | No | now | |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

**Relations:** one-to-many `Product`. No `deletedAt`: deletion is hard but guarded by a product reference count (BR-14).

### 5.4 `Product`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `name` | String | No | — | 1–140 chars |
| `slug` | String | No | — | Unique; public detail URL |
| `description` | String (text) | No | — | Searchable via full-text index |
| `priceCents` | Integer | No | — | ≥ 0; authoritative price (BR-02) |
| `imageUrls` | JSON (string array) | No | `[]` | Each entry must be absolute http(s) URL (BR-17) |
| `stock` | Integer | No | `0` | ≥ 0; CHECK constraint at DB level |
| `sku` | String | Yes | null | Unique when present |
| `isActive` | Boolean | No | `true` | Admin-controlled visibility switch |
| `deletedAt` | DateTime (UTC) | Yes | null | Soft delete (BR-14) |
| `categoryId` | String | No | — | FK → `Category.id`, `ON DELETE RESTRICT` |
| `createdAt` | DateTime (UTC) | No | now | |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

**Relations:** many-to-one `Category`; one-to-many `CartItem`; one-to-many `OrderItem` (nullable reference after product deletion via `SET NULL` on order items).

**Indexes:** `slug` (unique), `sku` (unique), `categoryId`, `priceCents`, composite `(isActive, deletedAt)`, full-text GIN index over name + description.

### 5.5 `Cart`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `userId` | String | No | — | Unique FK → `User.id`, `ON DELETE CASCADE` (one cart per user, BR-04) |
| `createdAt` | DateTime (UTC) | No | now | |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

**Relations:** one-to-one `User`; one-to-many `CartItem`.

### 5.6 `CartItem`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `cartId` | String | No | — | FK → `Cart.id`, `ON DELETE CASCADE` |
| `productId` | String | No | — | FK → `Product.id`, `ON DELETE RESTRICT` (products are soft-deleted) |
| `quantity` | Integer | No | `1` | 1–99; also capped by `Product.stock` (BR-05) |
| `createdAt` | DateTime (UTC) | No | now | |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

**Constraints:** unique `(cartId, productId)` — a product appears once per cart.

### 5.7 `ShippingSettings` (singleton)

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String | No | `"default"` | Primary key; fixed value enforces one row (BR-09) |
| `flatCents` | Integer | No | `999` | Flat fee in cents; ≥ 0 |
| `freeAboveCents` | Integer | Yes | `10000` | Subtotal at/above this waives shipping; null = never |
| `isActive` | Boolean | No | `true` | When false, shipping is 0 |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

### 5.8 `TaxSettings` (singleton)

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String | No | `"default"` | Primary key; fixed value enforces one row (BR-10) |
| `percentBps` | Integer | No | `0` | Basis points, 0–10000; e.g. 825 = 8.25 % |
| `isActive` | Boolean | No | `false` | When false, tax is 0 |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

### 5.9 `Order`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `orderNumber` | String | No | — | Unique, human-readable, generated server-side |
| `userId` | String | No | — | FK → `User.id`, `ON DELETE RESTRICT` (history preserved) |
| `status` | OrderStatus | No | `PENDING_PAYMENT` | Internal-only transient state inside checkout; mock capture moves it to `PAID` (BR-07) |
| `shippingAddress` | JSON | No | — | Immutable snapshot: fullName, phone, line1, line2?, city, state?, postalCode, country |
| `subtotalCents` | Integer | No | — | Snapshot |
| `shippingCents` | Integer | No | — | Snapshot from shipping settings |
| `taxCents` | Integer | No | — | Snapshot from tax settings |
| `totalCents` | Integer | No | — | subtotal + shipping + tax (BR-08) |
| `currency` | String | No | `"USD"` | Fixed for MVP (BR-19) |
| `idempotencyKey` | String | Yes | null | Unique per `(userId, idempotencyKey)` when present; prevents duplicate orders per customer (BR-18) |
| `placedAt` | DateTime (UTC) | No | now | Checkout completion time |
| `createdAt` | DateTime (UTC) | No | now | |
| `updatedAt` | DateTime (UTC) | No | now | Auto-updated |

**Relations:** many-to-one `User`; one-to-many `OrderItem`; one-to-many `OrderEvent`.

**Indexes:** `orderNumber` (unique), `idempotencyKey` (unique), composite `(userId, placedAt)` for history, `status` for admin filtering.

### 5.10 `OrderItem`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `orderId` | String | No | — | FK → `Order.id`, `ON DELETE CASCADE` |
| `productId` | String | Yes | null | FK → `Product.id`, `ON DELETE SET NULL`; kept as null after product removal |
| `productName` | String | No | — | Snapshot of name at purchase (BR-13) |
| `sku` | String | Yes | null | Snapshot of SKU |
| `unitPriceCents` | Integer | No | — | Snapshot of price |
| `quantity` | Integer | No | — | Snapshot, 1–99 |
| `lineTotalCents` | Integer | No | — | `unitPriceCents × quantity` |

**Immutability:** no update endpoint exists for order items; snapshots never change.

### 5.11 `OrderEvent`

| Field | Type | Null | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | String (cuid) | No | generated | Primary key |
| `orderId` | String | No | — | FK → `Order.id`, `ON DELETE CASCADE` |
| `fromStatus` | OrderStatus | Yes | null | Null for the initial event |
| `toStatus` | OrderStatus | No | — | Resulting status |
| `actorType` | ActorType | No | `SYSTEM` | Who caused the change |
| `actorId` | String | Yes | null | User id when `actorType` is CUSTOMER/ADMIN |
| `note` | String | Yes | null | Optional explanation |
| `createdAt` | DateTime (UTC) | No | now | Append-only |

**Relations:** many-to-one `Order`. No update or delete endpoints; events form the timeline in S-09 and A-08.

---

## 6. Relationships summary

| Parent → Child | Cardinality | FK / delete behaviour | Reason |
|---|---|---|---|
| `User` → `Cart` | 1 : 1 | `Cart.userId` unique, CASCADE | One cart per customer (BR-04) |
| `Cart` → `CartItem` | 1 : N | CASCADE | Removing a cart removes its lines |
| `Product` → `CartItem` | 1 : N | RESTRICT | Products are soft-deleted, not removed |
| `User` → `RefreshToken` | 1 : N | CASCADE | Deleting a user removes sessions |
| `User` → `Order` | 1 : N | RESTRICT | Order history outlives account changes |
| `Order` → `OrderItem` | 1 : N | CASCADE | Items belong to their order |
| `Product` → `OrderItem` | 1 : N (optional) | SET NULL | Product deletion keeps order snapshots |
| `Order` → `OrderEvent` | 1 : N | CASCADE | Events belong to their order |
| `Category` → `Product` | 1 : N | RESTRICT | Block category deletion while products exist (BR-14) |

---

## 7. Indexes and constraints

| Object | Definition | Purpose |
|---|---|---|
| Unique | `User.email`, `RefreshToken.tokenHash`, `Category.name`, `Category.slug`, `Product.slug`, `Product.sku` (partial where not null), `Cart.userId`, `CartItem(cartId, productId)`, `Order.orderNumber`, `Order(userId, idempotencyKey)`, `ShippingSettings.id`, `TaxSettings.id` | Enforce business uniqueness |
| Index | `Product.categoryId`, `Product.priceCents`, `Product(isActive, deletedAt)`, `CartItem.productId`, `Order(userId, placedAt)`, `Order.status`, `OrderItem.orderId`, `OrderEvent.orderId`, `RefreshToken.userId` | Filter and list performance |
| Full-text | Generated `searchVector` on `Product` (name + description) with GIN index; query with `websearch_to_tsquery('english', term)` | BR-03 search performance |
| Check | `Product.stock >= 0`, `Product.priceCents >= 0` | BR-06 no negative stock |
| Check | `CartItem.quantity BETWEEN 1 AND 99` | BR-05 |
| Check | `ShippingSettings.flatCents >= 0`, `TaxSettings.percentBps BETWEEN 0 AND 10000` | BR-09, BR-10 |
| Check | `Order.subtotalCents >= 0`, `shippingCents >= 0`, `taxCents >= 0`, `totalCents >= 0` | BR-08 integrity |
| Application | `imageUrls` entries validated as absolute http(s) URLs; email lowercased; slug generated from name | BR-17 |

Full-text and CHECK constraints are added via raw SQL in migrations because Prisma's portable schema alone cannot express them.

---

## 8. User roles and data access by role

| Entity | Guest | Customer | Admin |
|---|---|---|---|
| `User` | Create via register (CUSTOMER only) | Read own | Read all non-secret fields; no password hash exposure |
| `RefreshToken` | Create via login | Own only via cookie flow | Own only |
| `Category` | Read | Read | Full CRUD |
| `Product` | Read active, non-deleted only | Read active, non-deleted only | Read all; create/update/soft-delete |
| `Cart`, `CartItem` | No access | Own only | No access (back-office role) |
| `ShippingSettings`, `TaxSettings` | No access | Indirect via computed cart totals | Read/update |
| `Order`, `OrderItem` | No access | Own only | Read all |
| `OrderEvent` | No access | Read for own orders | Read for all orders; append via status change |

All access is enforced in services behind `requireAuth` / `requireAdmin` middleware as specified in `TRD.md`; the client never supplies role or ownership claims.

---

## 9. Business rules → schema enforcement

| Rule | Schema mechanism |
|---|---|
| BR-01 | `Product.isActive`, `Product.deletedAt`; public queries filter both |
| BR-02 | `Product.priceCents` is the only price source; order lines copy it |
| BR-03 | Full-text generated column + GIN index; category/price columns indexed |
| BR-04 | Unique `Cart.userId`; auth-gated routes |
| BR-05 | `CartItem.quantity` CHECK 1–99 plus service stock comparison |
| BR-06 | `Product.stock` CHECK ≥ 0; transaction row locks in `orderService` |
| BR-07 | `Order.status` default `PENDING_PAYMENT` then `PAID`; no payment fields in schema |
| BR-08 | Four total columns on `Order` with CHECK ≥ 0; computed in `pricingService` |
| BR-09 | Singleton `ShippingSettings` row |
| BR-10 | Singleton `TaxSettings` row with basis-point range CHECK |
| BR-11 | `OrderStatus` enum plus service-side transition map; `PENDING_PAYMENT` internal only |
| BR-12 | `OrderEvent` append-only timeline; stock restored in the same transaction |
| BR-13 | `OrderItem` snapshot fields, immutable; `Order.userId` ownership filter |
| BR-14 | `Product.deletedAt`; `Category` FK RESTRICT |
| BR-15 | `User.role` seeded to ADMIN only via seed script |
| BR-16 | `RefreshToken` with hash, expiry, revocation timestamp |
| BR-17 | JSON image URLs validated by Zod; integer cents/basis points |
| BR-18 | Unique `(userId, idempotencyKey)` on `Order` |
| BR-19 | `Order.currency` fixed to USD |
| BR-20 | No tables for payments, refunds, guest checkout, uploads, coupons, reviews, i18n, or analytics |

---

## 10. Migration and seed plan

| Step | Name | Contents |
|---|---|---|
| M-001 | `init` | All eleven tables, enums, columns, keys, unique constraints, and foreign keys |
| M-002 | `product_search` | Generated `searchVector` column and GIN index on `Product` |
| M-003 | `integrity_checks` | CHECK constraints for stock, quantity, money, settings, and totals |
| S-001 | `seed` | Idempotent upserts using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` |

**Seed dataset**
- 1 admin user with role `ADMIN` and hashed password from environment variables.
- 5 categories: Electronics, Home & Kitchen, Books, Fitness, Accessories.
- 12 active products with valid http(s) image URLs, varied prices and stock levels (including one with stock 0 to exercise the sold-out state).
- Shipping settings: `flatCents = 999`, `freeAboveCents = 10000`, `isActive = true`.
- Tax settings: `percentBps = 0`, `isActive = false`.
- No seeded customers, carts, or orders; those are created through the API during testing.

Migrations run with `prisma migrate deploy` as a deploy step; the seed runs once manually. Neither runs at application runtime.

---

## 11. Expected output

This document produces:

1. Eleven fully specified entities with field types, nullability, defaults, and constraints.
2. Three enumerations and a complete relationship/delete-behaviour map.
3. Unique constraints, indexes, full-text configuration, and CHECK constraints tied to specific business rules.
4. A role-based data-access matrix and a migration/seed plan with concrete default values.
5. Full traceability of BR-01 … BR-20 into database structures, consistent with `PRD.md`, `TRD.md`, `APP-FLOW.md`, and `UI-UX-BRIEF.md`.

**No implementation code is produced by this document.**
