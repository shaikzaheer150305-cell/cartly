# Cartly — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Approved for planning  
**Last updated:** 2026-11-21  
**Related documents:** `TRD.md`, `APP-FLOW.md`, `UI-UX-BRIEF.md`, `BACKEND-SCHEMA.md`

---

## 1. Purpose

Cartly is a single-store online shopping platform. This PRD defines **what** the product must do, for whom, and under which business rules. It is the source of truth for scope and acceptance criteria; the TRD defines how it is built, the App Flow defines how users move through it, the UI/UX Brief defines how it looks and behaves, and the Backend Schema defines how data is stored.

The product goal is to let a customer discover a product, add it to a cart, and place an order without staff involvement, while letting an administrator maintain the catalog and process orders through a small set of status transitions.

**Business objectives**

1. Launch a working end-to-end purchase loop: browse → search → detail → cart → checkout → order history.
2. Give administrators full self-service control over products, categories, pricing rules, and order fulfilment status.
3. Establish a foundation that can later accept a real payment gateway, image uploads, notifications, and richer merchandising without re-architecting core flows.

**Non-goals for this release:** real payments, refunds/returns, guest checkout, multi-vendor, multi-currency, multi-language, reviews, wishlists, and marketing automation.

---

## 2. User roles

| Role | Description | Can do | Cannot do |
|---|---|---|---|
| `GUEST` | Unauthenticated visitor | Browse catalog, search/filter, view product details, register, log in | Add to cart, check out, view orders, access admin |
| `CUSTOMER` | Registered shopper | Everything a guest can do, plus cart management, checkout, own order history/detail, cancel own eligible orders | Access admin functions, view other customers' orders, change product data |
| `ADMIN` | Seeded back-office operator | Product and category CRUD, shipping/tax settings, view all orders, update order status, cancel eligible orders | Shop with the admin account, register publicly, view customer passwords |

**Role constraints**

- An admin account is created only by the database seed from environment variables; there is no public admin signup.
- Admin and customer identities are separate. An admin who wants to shop uses a distinct customer account.
- Roles are assigned at creation and are not self-editable.
- Admins may browse the public catalog but see no purchase controls; purchase actions are customer-only.

---

## 3. Features

### 3.1 Feature inventory

| ID | Feature | Role | Priority |
|---|---|---|---|
| F-01 | Customer registration and login | Guest → Customer | P0 |
| F-02 | Session refresh and logout | Customer, Admin | P0 |
| F-03 | Product catalog browsing with pagination | Guest+ | P0 |
| F-04 | Search and filtering (category, price, sort) | Guest+ | P0 |
| F-05 | Product detail page | Guest+ | P0 |
| F-06 | Cart: add, update quantity, remove, view totals | Customer | P0 |
| F-07 | Checkout with address capture and mock payment | Customer | P0 |
| F-08 | Order confirmation, history, and detail | Customer | P0 |
| F-09 | Customer order cancellation | Customer | P0 |
| F-10 | Admin login and back-office shell | Admin | P0 |
| F-11 | Admin product create/edit/soft-delete/view | Admin | P0 |
| F-12 | Admin category create/edit/delete/view | Admin | P0 |
| F-13 | Admin shipping and tax settings | Admin | P0 |
| F-14 | Admin order list, detail, and status updates | Admin | P0 |
| F-15 | Stock enforcement and stock decrement | System | P0 |
| F-16 | Order audit events | System | P0 |
| F-17 | Password reset email | Guest | P1 |
| F-18 | Product image upload | Admin | P1 |
| F-19 | Email notifications | System | P1 |
| F-20 | Coupons, discounts, loyalty | All | P2 |
| F-21 | Reviews, ratings, wishlist | Customer | P2 |
| F-22 | Advanced search with autocomplete/synonyms | Guest+ | P2 |
| F-23 | Admin analytics dashboard | Admin | P2 |
| F-24 | Returns, refunds, multi-currency, i18n | All | P2 |

P0 is the MVP for this release. P1/P2 are explicitly out of scope and listed to protect the roadmap.

### 3.2 Detailed requirements

#### F-01 / F-02 — Identity
- Register with name, email, and password; email must be unique and normalised to lowercase.
- Password minimum 8 characters; stored only as a bcrypt/argon2 hash.
- Login returns a short-lived access token plus a rotating refresh token.
- Session survives page refresh; logout revokes the refresh token.
- expired or invalid credentials produce a clear, non-leaking error message.

#### F-03 / F-04 / F-05 — Catalog discovery
- Public catalog lists active, non-deleted products only, paginated (default 12 per page, maximum 50).
- Search matches product name and description using PostgreSQL full-text search.
- Filters: category, minimum price, maximum price; sort by relevance, newest, price ascending, price descending.
- Product detail shows name, price, description, image gallery from URLs, category, and stock availability.
- Out-of-stock products remain visible but cannot be added to cart.

#### F-06 — Cart
- Cart requires authentication; an unauthenticated add-to-cart attempt redirects to login and then returns to the product page.
- One cart per customer; a product appears at most once per cart.
- Quantity is an integer from 1 to 99 and is also capped by available stock.
- Cart shows line items, line totals, subtotal, estimated shipping, estimated tax, and estimated order total using the current settings.

#### F-07 / F-08 / F-09 — Ordering
- Checkout captures a shipping address (full name, phone, line 1, line 2 optional, city, state optional, postal code, country).
- Prices, stock, and pricing rules are re-validated server-side at checkout; the client-submitted total is never trusted.
- Checkout creates an order, snapshots product data into order lines, applies a mock payment capture, decrements stock, and clears the cart in one atomic transaction.
- Order number is unique and human-readable.
- Customers see only their own orders, newest first, and can open an order detail view.
- Cancellation is allowed while an order is `PAID`; stock is restored and an audit event is written. `PENDING_PAYMENT` is internal only and never presented for cancellation.

#### F-10 to F-14 — Administration
- Admin login uses the same authentication endpoint with role-based route guards.
- Product management: create, view (including inactive/deleted), edit all fields, soft-delete with confirmation.
- Category management: create, view, edit, delete; deletion is refused while any product (including soft-deleted) references the category.
- Shipping settings: flat fee in cents, optional free-above-subtotal threshold, active toggle.
- Tax settings: percentage in basis points, active toggle.
- Order management: view all orders with filters by status and customer, open detail, move status forward through the allowed transitions, and cancel eligible orders.

#### F-15 / F-16 — System integrity
- Checkout locks product rows, verifies stock, and rejects the request if any line is unavailable.
- Every status change writes an immutable `OrderEvent` with actor type (`SYSTEM`, `CUSTOMER`, `ADMIN`).

---

## 4. Canonical business rules

These rule IDs are referenced by all five planning documents.

| ID | Rule |
|---|---|
| BR-01 | Only products with `isActive = true` and `deletedAt = null` appear in the public catalog; admins can view all states. |
| BR-02 | Product price is authoritative in the database and always re-read at cart display and checkout. |
| BR-03 | Search uses full-text matching on name and description; filters and pagination are applied server-side; page size is capped at 50. |
| BR-04 | Cart access requires authentication; exactly one cart exists per customer; a product may appear once per cart. |
| BR-05 | Cart quantity must be an integer between 1 and 99 and may not exceed current stock. |
| BR-06 | Checkout fails entirely if any item is inactive, deleted, or has insufficient stock; stock never becomes negative. |
| BR-07 | Checkout creates the order as `PENDING_PAYMENT` inside the transaction, immediately applies the mock capture, and records `PAID`. `PENDING_PAYMENT` is an internal-only transient state and is never user-visible or admin-actionable. No real payment data is collected. |
| BR-08 | `subtotal = Σ(unitPrice × qty)`; `shipping = 0` when subtotal ≥ free threshold, otherwise the flat fee; `tax = round(subtotal × percentBps / 10000)`; `total = subtotal + shipping + tax`. |
| BR-09 | Shipping settings are a single admin-editable record: flat fee in cents, optional free-above threshold in cents, active flag. |
| BR-10 | Tax settings are a single admin-editable record: percentage in basis points and an active flag; tax applies to subtotal only. |
| BR-11 | `PENDING_PAYMENT → PAID` occurs only as the internal mock capture during checkout. User-visible transitions: `PAID → PROCESSING | CANCELLED`; `PROCESSING → SHIPPED`; `SHIPPED → DELIVERED`. All other transitions are rejected. |
| BR-12 | Cancelling an order restores purchased quantities to stock and writes a `CANCELLED` event; status changes are audited. |
| BR-13 | Customers can read only their own orders; admins can read all orders; order lines and totals are immutable snapshots. |
| BR-14 | Product deletion is soft (`deletedAt`); category deletion is blocked while any product, including a soft-deleted one, references it. |
| BR-15 | Admin accounts are seeded from environment variables, cannot self-register, and are back-office only. |
| BR-16 | Passwords are hashed; access tokens last 15 minutes; refresh tokens last 7 days, rotate on use, and are revoked on logout or reuse. |
| BR-17 | All external input is validated; image URLs must be absolute http(s) URLs; money is stored as integer cents and tax as basis points. |
| BR-18 | Checkout is idempotent via a client-generated key scoped to the customer (unique per `(userId, idempotencyKey)`); concurrent cart/stock operations are serialised per product row. |
| BR-19 | The MVP uses one currency (USD) and English copy; no exchange rates or translations. |
| BR-20 | Real payments, refunds/returns, guest checkout, uploads, email, coupons, reviews, analytics, multi-currency, and i18n are out of scope. |

---

## 5. Business rules applied to each feature

| Feature | Governing rules |
|---|---|
| F-01 / F-02 | BR-15, BR-16, BR-17 |
| F-03 / F-04 / F-05 | BR-01, BR-02, BR-03, BR-19 |
| F-06 | BR-02, BR-04, BR-05, BR-08 |
| F-07 | BR-02, BR-06, BR-07, BR-08, BR-09, BR-10, BR-13, BR-18 |
| F-08 / F-09 | BR-11, BR-12, BR-13 |
| F-10 / F-11 / F-12 | BR-01, BR-14, BR-15, BR-17 |
| F-13 | BR-08, BR-09, BR-10 |
| F-14 | BR-11, BR-12, BR-13, BR-15 |
| F-15 / F-16 | BR-06, BR-11, BR-12, BR-18 |

---

## 6. Acceptance criteria

| ID | Acceptance criterion |
|---|---|
| AC-01 | A guest can search by keyword, filter by category and price, paginate, and open a product detail page. |
| AC-02 | A guest clicking "Add to cart" is sent to login and returned to the same product afterwards. |
| AC-03 | A customer can add, change quantity of, and remove cart items; totals recompute from server settings. |
| AC-04 | Checkout with insufficient stock returns a clear error and leaves the cart unchanged. |
| AC-05 | A successful checkout creates one order with correct line snapshots and totals, decrements stock, empties the cart, and shows confirmation. |
| AC-06 | Repeating the same checkout request with the same customer-scoped idempotency key does not create a second order; the same key from a different customer is independent. |
| AC-07 | A customer sees only their own orders and can cancel an order in `PAID`. |
| AC-08 | An admin can create, edit, and soft-delete products; deleted products disappear from the public catalog but remain in old orders. |
| AC-09 | Category deletion is refused when products, including soft-deleted ones, reference it. |
| AC-10 | Changing shipping or tax settings changes cart estimates and the totals of newly placed orders, but never changes existing orders. |
| AC-11 | An admin can move an order `PAID → PROCESSING → SHIPPED → DELIVERED`; invalid transitions return a 409 error. |
| AC-12 | Every status change is visible in the order detail timeline with actor and timestamp. |
| AC-13 | A non-admin cannot reach any admin route through the API or the UI. |
| AC-14 | All screens are usable at 375 px and 1440 px widths with visible focus states and labelled form fields. |

---

## 7. Success metrics

| Metric | Target |
|---|---|
| End-to-end purchase completion in test environment | 100% of AC-04/AC-05 scenarios pass |
| Catalog listing response time (p95, warm cache) | < 300 ms |
| Checkout response time (p95) | < 800 ms |
| Critical API paths covered by automated tests | 100% of checkout, auth, status, and permission paths |
| Accessibility | WCAG 2.1 AA on core flows, keyboard-only completion possible |

---

## 8. Assumptions and dependencies

- Managed PostgreSQL with a pooled connection string is available.
- Static hosting for the SPA and a managed Node/Express runtime are available.
- Seed environment variables provide the initial admin credentials.
- Product images are externally hosted URLs; no upload pipeline in this release.
- English/USD only; no locale negotiation.
- No account profile, password reset, product restore, or admin action audit in the MVP; these remain deferred roadmap items.

---

## 9. Expected output

This PRD produces:

1. An approved, prioritised feature scope (P0 MVP plus protected P1/P2 roadmap).
2. Three defined roles with explicit permission boundaries.
3. Twenty canonical business rules (BR-01 … BR-20) reused verbatim across all planning documents.
4. Fourteen measurable acceptance criteria used to verify the MVP.
5. A shared vocabulary for requirements, UX, API, and data design; no unresolved product-level ambiguity before implementation begins.

**No implementation code is produced by this document.**
