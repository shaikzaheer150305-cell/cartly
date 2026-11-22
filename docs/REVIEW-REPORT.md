# Cartly — Planning Documents Review Report

**Version:** 1.0  
**Date:** 2026-11-21  
**Documents reviewed:** `PRD.md`, `TRD.md`, `APP-FLOW.md`, `UI-UX-BRIEF.md`, `BACKEND-SCHEMA.md`  
**Scope:** requirements coverage, contradictions, screens, data relationships, API coverage, authentication/authorization, security, testing.  
**Status:** Review only. No planning document or requirement has been changed.

---

## 0. Executive summary

The five documents form a coherent foundation: roles, BR-01 … BR-20, money handling, soft deletion, order snapshots, and the checkout transaction are consistently described. However, the review found **31 findings**, of which **7 are high severity** and should be resolved before implementation starts.

**High-severity items**

| ID | Finding |
|---|---|
| R-01 | `GET /api/categories` documents an admin `includeInactive` filter, but `Category` has no `isActive` field. |
| R-02 | No API endpoint exists for admin order detail, although `/admin/orders/:id` is a defined screen. |
| R-03 | `PENDING_PAYMENT` is described as cancellable and administratively actionable, but BR-07 makes it an instantly-transient internal state. |
| R-04 | `Order.idempotencyKey` is globally unique rather than scoped to the customer, enabling cross-user collisions/abuse. |
| R-05 | No CSRF protection is specified for cookie-authenticated state-changing requests. |
| R-06 | No concurrency/oversell test is specified, despite NFR-07 requiring zero oversold units. |
| R-07 | No authorization matrix test is specified across all endpoints. |

---

## 1. Missing requirements

| ID | Sev | Document(s) | Finding | Recommendation |
|---|---|---|---|---|
| R-01 | High | TRD §3.3, Schema §5.3 | `includeInactive` query parameter for categories has no corresponding field. | Decide: remove the parameter, or add `isActive` to `Category` plus admin toggle UI. |
| R-08 | Med | PRD, App Flow, UI Brief | No customer account/profile screen or change-password flow/endpoint. Header shows an "account menu with Logout" only. | Decide whether profile self-service is in MVP or explicitly deferred. |
| R-09 | Med | PRD F-17, all others | Password reset is listed as P1 but has no flow, endpoint, screen, or schema anywhere; no "Forgot password?" link specified. | Confirm it is intentionally deferred; if UI should show a disabled/coming-soon link, define it. |
| R-10 | Med | PRD, Schema | No restore path for soft-deleted products; deletion is effectively irreversible through the app. | Decide whether admin needs "Restore" in A-02 and a `PATCH` restore endpoint. |
| R-11 | Med | Schema §5.9, UI A-08 | `Order` snapshots address and items but not customer name/email; admin detail shows live `User` identity. Historical identity can drift. | Add `customerName`/`customerEmail` snapshots, or accept live identity. |
| R-12 | Med | TRD, Schema | Only order status changes are audited. Product edits, deletion, category changes, and settings changes have no audit trail or `updatedByAdminId`. | Decide whether an admin action log is required in MVP. |
| R-13 | Med | App Flow FL-04/FL-14, BR-06 | Behaviour of cart lines when a product becomes inactive or soft-deleted is undefined; only checkout rejection is defined. | Define whether lines remain with a warning, are flagged, or are auto-removed. |
| R-14 | Low | UI S-03, A-02 | "Low stock" uses a hard-coded `stock ≤ 5` with no business rule or setting. | Define a named constant or admin setting. |
| R-15 | Low | PRD F-07, Schema §5.9 | Shipping address fields are captured but validation rules (phone, postal code, country values, max lengths) are undefined. | Define Zod rules and allowed country representation. |
| R-16 | Low | TRD §3.5, Schema §5.9 | Order-number format is only "unique and human-readable"; no generation rule. | Define format, sequence source, and collision handling. |
| R-17 | Low | UI A-02/A-07, TRD §3.3 | Admin product list supports status search/filter and admin orders support customer filter, but query parameters are not specified. | Document exact query parameter names and semantics. |

---

## 2. Contradictory features

| ID | Sev | Document(s) | Finding | Recommendation |
|---|---|---|---|---|
| R-03 | High | PRD BR-07, App Flow §16, UI A-08 | Checkout immediately records `PAID`, so `PENDING_PAYMENT` is never user-visible; yet flows offer "mark PAID" and customer/admin cancellation from `PENDING_PAYMENT`. | Choose one interpretation: transient internal-only state, explicit demo payment step, or remove the state. |
| R-18 | Med | App Flow §3, UI §5/A-00 | Admin may browse public `/products`, but UI states admins have no cart/checkout UI; Add-to-cart behaviour for an authenticated admin is undefined. | Define: hide add-to-cart for admins, or redirect admin to `/admin`. |
| R-19 | Med | TRD §5 | Document says "the `role` claim is read from the database, not trusted from the client", while the chosen auth is JWT-based; unclear whether role comes from the signed token or a DB lookup per request. | State explicitly: role from signed JWT claim, or DB lookup on each request (with cache), and update the sentence. |
| R-20 | Low | UI A-08 | Text says "the single allowed transition action", but from `PAID` both `PROCESSING` and `CANCELLED` are allowed. | Reword to "the allowed forward transition plus cancel where permitted". |
| R-21 | Low | UI S-04, App Flow FL-08 | Login for a non-admin admin-attempt says "redirect `/` with note", but the UI spec defines no such notice. | Define the notice or remove it. |

---

## 3. Missing application screens

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| R-08 | Med | Account/profile and change-password screens absent. | Scope decision required. |
| R-09 | Med | Forgot/reset password screens absent. | Confirm deferral. |
| R-22 | Med | No screen/action to restore a soft-deleted product (A-02 has status filter only). | Scope decision required. |
| R-23 | Low | No dedicated "order not found / not yours" state; generic 404/forbidden is assumed. | Define whether a dedicated state is needed for AC-07. |
| R-24 | Low | If R-12 is accepted, no admin audit-log screen is specified. | Add `A-09 Audit log` or keep API-only. |

---

## 4. Incorrect or under-specified database relationships

| ID | Sev | Document(s) | Finding | Recommendation |
|---|---|---|---|---|
| R-25 | Med | Schema §5.11 | `OrderEvent.actorId` is a bare `String` with no FK to `User`, so audit actor integrity is not enforced. | Make it a nullable FK `ON DELETE SET NULL`, or document deliberate denormalisation. |
| R-04 | High | Schema §5.9, §7 | `Order.idempotencyKey` is globally unique. A key generated/observed by one customer could collide with another customer's request. | Use unique `(userId, idempotencyKey)`; define key format/length. |
| R-26 | Med | Schema §5.7/§5.8 | Singleton settings rows have no `updatedByAdminId`; changes cannot be attributed. | Add `updatedByAdminId` FK if R-12 is accepted. |
| R-27 | Low | Schema §5.4, §7 | `imageUrls` is described as a string array but only Zod validates it; no DB-level shape check. | Acceptable for MVP; state explicitly that it is application-enforced only. |
| R-28 | Low | Schema §5.11 | Nothing prevents duplicate `OrderEvent` rows for the same transition. | Add a deduplication rule in `orderService` or a composite uniqueness constraint if needed. |
| R-29 | Low | Schema §5.1/§5.6 | `User → Cart` is 1:1 and `CartItem.productId` is NOT NULL with RESTRICT; this is internally correct, but hard-deleting a product would be blocked. Confirm no hard-delete path exists anywhere. | Confirm; current API only soft-deletes, so correct. |

No incorrect cardinality was found in `User → Cart`, `Cart → CartItem`, `Category → Product`, `Order → OrderItem`, or `Order → OrderEvent`.

---

## 5. Missing API endpoints

| ID | Sev | Document(s) | Finding | Recommendation |
|---|---|---|---|---|
| R-02 | High | TRD §3.3, App Flow §16, UI A-08 | `GET /api/orders/:id` is CUSTOMER-only; no admin equivalent exists for `/admin/orders/:id`. | Add `GET /api/orders/admin/:id` (recommended) or define an admin override on the existing route. |
| R-30 | Low | TRD §3.9 vs §3.3 | `GET /api/health` is required by deployment but absent from the API contract table. | Add it to the contract with no auth. |
| R-17 | Low | TRD §3.3 | Query parameters for admin product status filter, admin order customer filter, and `includeInactive` are not enumerated. | Document them in the contract. |
| R-31 | Low | TRD §3.3, App Flow §16 | Admin can cancel via `PATCH /api/orders/:id/status`, while a separate `POST /api/orders/:id/cancel` is customer-scoped. Two paths for the same business action. | State the canonical admin path and restrict the other. |
| R-10 | Med | TRD §3.3 | No restore endpoint for soft-deleted products. | Add `POST /api/products/:id/restore` if restore is in scope. |
| R-08 | Med | TRD §3.3 | No profile update / change-password endpoint. | Scope decision required. |

---

## 6. Authentication and authorization issues

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| R-05 | High | No CSRF protection is specified for cookie-authenticated `POST`/`PATCH`/`DELETE` requests. `SameSite=Lax` reduces but does not eliminate risk. | Require Origin/Referer validation plus SameSite=Lax on a same-origin proxy, or add a double-submit CSRF token. |
| R-04 | High | Idempotency key not user-scoped (see above). | Scope to user. |
| R-32 | Med | `POST /api/auth/register` returns 409 "email already registered" (FL-02), enabling account enumeration, while login deliberately uses a generic error. | Decide: accept enumeration risk for UX, or send a neutral response and email verification later. |
| R-33 | Med | Logout revokes only the refresh token; a stolen access token remains valid up to 15 minutes. | Document as accepted limitation or add a token-version/session id check. |
| R-19 | Med | Role source ambiguity (see R-19). | Clarify. |
| R-34 | Low | Rate limiting is per IP only (10/min for auth/checkout); no per-account lockout or progressive delay. | Decide whether account-level throttling is needed. |
| R-35 | Low | Seeded admin password has no forced rotation on first login. | Add "change password on first login" if in scope. |
| R-18 | Med | Admin role on public product pages undefined. | Clarify. |

---

## 7. Security requirements

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| R-05 | High | CSRF absent (see above). | Decide control. |
| R-36 | Med | No request body size limits or per-field maximum lengths specified for address, name, description, and image URL arrays. | Add Express JSON limit and Zod `.max()` constraints. |
| R-37 | Med | No log redaction policy for PII, tokens, addresses, or error details; only "passwords never logged" is stated. | Define redaction rules for logs and error payloads. |
| R-38 | Med | No dependency/vulnerability scanning or secret-scanning requirement in CI. | Add npm audit/Dependabot-style check to delivery requirements. |
| R-12 | Med | Administrative changes are not audited (see above). | Decide. |
| R-39 | Low | HTTPS/HSTS is stated via Helmet, but no explicit platform-level HTTP→HTTPS redirect requirement. | Add to deployment requirements. |
| R-40 | Low | No CAPTCHA/bot control on registration beyond rate limiting. | Accept for MVP or add later. |

---

## 8. Missing testing requirements

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| R-06 | High | NFR-07 requires zero oversold units under concurrency, but the test plan has no concurrent-checkout test. | Add a Supertest concurrency test for two buyers and one remaining unit. |
| R-07 | High | No test that every endpoint rejects wrong roles and cross-owner access. | Add a table-driven authorization suite covering all endpoints. |
| R-41 | Med | No security tests for CSRF, refresh-token reuse, rate limiting, or idempotency-key reuse. | Add to API integration suite. |
| R-42 | Med | No migration/seed idempotency test. | Add a CI step applying migrations twice and running seed twice. |
| R-43 | Med | Acceptance criteria AC-08 (soft delete/history), AC-09 (category in use), and AC-10 (settings vs historical orders) have no mapped tests. | Map each AC to at least one test. |
| R-44 | Low | No coverage target or CI gate; PRD says "100% of critical paths" but TRD does not enforce it. | Define coverage scope and CI enforcement. |
| R-45 | Low | No automated accessibility test; manual smoke only. | Optional: add axe checks for core screens. |

---

## 9. What is consistent and can be kept as-is

- Role definitions and the guest/customer/admin boundary are aligned across all five documents.
- BR-01 … BR-20 are present and referenced consistently; no conflicting rule IDs found.
- Integer cents, basis points, and the subtotal/shipping/tax/total formula are consistent.
- Soft deletion of products, category reference blocking, and immutable order snapshots are consistent.
- The checkout transaction steps match between TRD §3.5 and App Flow FL-05.
- Route matrix (23 routes), screens (10 storefront + 9 admin), entity count (11), and endpoint count (30 after review fixes) are internally consistent.
- Error envelope, list envelope, and ISO-8601 timestamps are consistently specified.

---

## 10. Resolved decisions (approved)

| Finding | Approved decision | Applied to |
|---|---|---|
| R-03 | `PENDING_PAYMENT` is a transient internal-only state; no admin/customer action from it. Cancellation is from `PAID` only. | PRD BR-07/BR-11/AC-07/F-09; TRD status machine; App Flow FL-06/FL-07/FL-12/state diagram; UI S-09/A-07/A-08; Schema §4/§5.9 |
| R-01 | Remove `includeInactive`; `Category` keeps no `isActive` field. | TRD §3.3 |
| R-02 | Add dedicated `GET /api/orders/admin/:id`. | TRD §3.3; App Flow FL-12 |
| R-04 | Idempotency key unique per `(userId, idempotencyKey)`. | PRD BR-18/AC-06; TRD §3.5/BR-18; App Flow FL-05; Schema §5.9/§7/BR-18 |
| R-05 | Reject cross-origin `POST`/`PATCH`/`DELETE` via `Origin`/`Referer` checks with `SameSite=Lax` and same-origin `/api` proxy. | TRD §3.6 |
| R-08 / R-09 / R-10 / R-11 / R-12 | Defer profile, password reset, product restore, customer snapshots, and admin audit beyond MVP. | PRD §8; UI S-04 |
| R-06 / R-07 / R-41 / R-42 / R-43 / R-44 | Extend test plan with concurrency, authorization matrix, security, data-lifecycle, and AC-mapped tests. | TRD §3.10 |
| R-18 | Admins browsing public catalog see no purchase controls. | PRD §2; TRD §5; App Flow §3/FL-03; UI §5/S-03 |
| R-30 | `GET /api/health` added to the documented API contract. | TRD §3.3 |

The five planning documents were updated to reflect these approved decisions. No application code was generated.
