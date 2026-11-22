# Cartly — UI/UX Design Brief

**Version:** 1.0  
**Status:** Approved for planning  
**Last updated:** 2026-11-21  
**Related documents:** `PRD.md`, `TRD.md`, `APP-FLOW.md`, `BACKEND-SCHEMA.md`

---

## 1. Purpose

This brief defines the visual language, layout system, component behaviour, and screen-by-screen specifications for Cartly. It turns the navigation in `APP-FLOW.md` into a buildable interface and makes the business rules BR-01 … BR-20 visible and understandable to users. It covers the public storefront, the customer area, and the admin back-office.

---

## 2. Design principles

### 2.1 Detailed requirements

- Implement all screens in section 6 with the desktop and mobile layouts specified there.
- Apply the token system in section 3 consistently; no hard-coded one-off colours or spacing.
- Provide loading, empty, error, disabled, and success states for every data-driven screen.
- Use the same primitives for storefront and admin; role differences are in navigation and actions only.
- Meet the accessibility requirements in section 8; keyboard completion is mandatory for purchase and admin order flows.

1. **Clarity over decoration** — price, availability, and status are never ambiguous.
2. **Server truth in the interface** — totals, stock, and status shown are the server's values, never optimistic guesses (BR-02, BR-08).
3. **Guards are explanatory** — when access is denied or an action is blocked, say why and offer the next step.
4. **Mobile first, desktop efficient** — the same task must be completable at 375 px and 1440 px.
5. **Accessible by default** — keyboard operable, labelled, contrast compliant.
6. **Calm feedback** — toasts for confirmations, inline errors for corrections, no noisy animation.

---

## 3. Design system specifications

### 3.1 Colour tokens

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Brand primary | `#4F46E5` | `indigo-600` | Primary buttons, active nav, focus |
| Brand hover | `#4338CA` | `indigo-700` | Button hover/pressed |
| Page background | `#F8FAFC` | `slate-50` | App canvas |
| Surface | `#FFFFFF` | `white` | Cards, inputs, header |
| Text primary | `#0F172A` | `slate-900` | Headings, body |
| Text muted | `#64748B` | `slate-500` | Secondary copy, metadata |
| Border | `#E2E8F0` | `slate-200` | Dividers, input borders |
| Success | `#059669` | `emerald-600` | Confirmations, DELIVERED |
| Info | `#0284C7` | `sky-600` | PAID, informative banners |
| Warning | `#D97706` | `amber-600` | Low stock, attention states |
| Danger | `#E11D48` | `rose-600` | Errors, CANCELLED, delete |
| Processing | `#7C3AED` | `violet-600` | PROCESSING, SHIPPED |

**Status badge mapping:** `PENDING_PAYMENT` amber, `PAID` sky, `PROCESSING` indigo, `SHIPPED` violet, `DELIVERED` emerald, `CANCELLED` rose. Badges use tinted backgrounds with 8% opacity of the same hue and full-strength text. `PENDING_PAYMENT` is internal only and is not rendered in the MVP.

### 3.2 Typography

| Role | Size / line height | Weight |
|---|---|---|
| Display (home hero) | 36 / 44 px | 700 |
| H1 (page title) | 30 / 36 px | 700 |
| H2 (section title) | 24 / 32 px | 600 |
| H3 (card title) | 18 / 28 px | 600 |
| Body | 16 / 24 px | 400 |
| Small / label | 14 / 20 px | 500 |
| Caption / metadata | 12 / 16 px | 400 |

Font stack: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`. Prices use tabular numerals.

### 3.3 Layout and spacing

- Base spacing unit: 4 px; scale 4, 8, 12, 16, 24, 32, 48, 64 px.
- Max container width: 1280 px (`max-w-7xl`), centred.
- Gutters: 16 px mobile, 24 px tablet, 32 px desktop.
- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Product grid: 2 columns mobile, 3 at `md`, 4 at `lg`; gap 16/24 px.
- Cards: 12 px radius, 1 px border, subtle small shadow; hover lifts 1 px with medium shadow on interactive cards only.
- Inputs and buttons: 8 px radius, 40 px height (44 px on touch targets), 16 px horizontal padding.
- Focus indicator: 2 px indigo ring with 2 px offset on every interactive element.

### 3.4 Component inventory

`Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `Badge`, `StatusBadge`, `Price`, `Card`, `Alert`, `Toast`, `Modal`, `ConfirmDialog`, `Skeleton`, `EmptyState`, `Pagination`, `QuantityStepper`, `ProductCard`, `FilterPanel`, `Table`, `Tabs`, `Breadcrumb`, `OrderTimeline`.

**Shared behaviour**
- Buttons: primary (brand fill), secondary (bordered), ghost (text only), danger (rose). Disabled state uses 50% opacity and `cursor-not-allowed`.
- Form fields: label above input, helper text below, red border and inline message on error; never rely on placeholder alone.
- Toasts: appear bottom-right, auto-dismiss after 4 s, `aria-live="polite"`.
- Confirm dialogs: required for delete product, delete category, and cancel order; destructive action labelled explicitly.
- Loading: skeleton blocks matching final content shape; buttons show spinner and remain disabled during submit.
- Empty states: illustration-free, one-line explanation, one primary next action.

---

## 4. Features represented in the UI

| Feature | Primary screen | Visual expression |
|---|---|---|
| Browse/search/filter | S-02 | Search field, filter rail, sort select, result count, pagination |
| Product detail | S-03 | Image, price, stock badge, Add to cart |
| Auth | S-04 | Split form card, inline validation, role unaware |
| Cart | S-05 | Line items with steppers, totals summary panel |
| Checkout | S-06 | Address form + order summary, Place order |
| Confirmation/history/detail | S-07 … S-09 | Order number, status badge, timeline, snapshots |
| Product/category admin | A-02 … A-05 | Tables, forms, status toggles, confirm dialogs |
| Settings | A-06 | Two compact forms with live preview note |
| Order processing | A-07, A-08 | Filterable table, detail, single allowed-action button |

---

## 5. User roles in the interface

| Role | Chrome | Navigation |
|---|---|---|
| Guest | Storefront header with Search, Products, Login, Register; cart icon prompts login | Public routes only |
| Customer | Storefront header with Search, Products, My orders, cart badge with count, account menu with Logout | Storefront + customer area |
| Admin | Back-office shell with left sidebar and top bar; no cart/checkout UI; public catalog pages hide Add to cart | Products, Categories, Settings, Orders, Logout |

The same `/login` screen serves both roles; the interface never asks the user to declare a role (BR-15). After authentication the app routes to the role-appropriate shell (`APP-FLOW.md` FL-02/FL-08).

---

## 6. Screen layouts

### Global storefront chrome

```text
┌──────────────────────────────────────────────────────────┐
│ Cartly        Search products…            Products  Orders  [Cart 2]  logout │
└──────────────────────────────────────────────────────────┘
```
- Sticky header, 64 px tall, white with bottom border.
- Search input in header on `md+`; on mobile it collapses to an icon opening a full-width search field.
- Cart badge shows item count; guests see a Cart icon that leads to login.
- Footer: links to Products, My orders, and a note "Demo store — no real payments are processed."

### S-01 Home

- Hero: short value proposition, primary CTA "Browse products", secondary "How it works" anchor.
- "Featured products" row using `ProductCard`, 4 across on desktop, 2 on mobile.
- "Shop by category" tile grid linking to `/products?category=<slug>`.
- Trust strip: "Demo checkout", "Stock-checked orders", "Order tracking".

### S-02 Product listing `/products`

```text
┌──────────────┬───────────────────────────────────────────┐
│ Filters      │ Products (128)            Sort: Newest ▾   │
│ Category ☐   │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │
│ Price range  │ │ image │ │ image │ │ image │ │ image │    │
│ Clear all    │ │ Name  │ │ Name  │ │ Name  │ │ Name  │    │
│              │ │ $19.99│ │ $24.50│ │ $12.00│ │ $35.00│    │
│              │ └───────┘ └───────┘ └───────┘ └───────┘    │
│              │                1 2 3 … 11     Next →        │
└──────────────┴───────────────────────────────────────────┘
```
- Filter rail is 240 px on `lg+`; on smaller screens it becomes a "Filters" button opening a slide-over panel.
- Active filters render as removable chips above the grid.
- Search term, category, price, sort, and page are all reflected in the URL query string so views are shareable.
- States: loading skeletons, empty results with "Clear filters", error with retry.
- Rules surfaced: BR-01, BR-03, BR-19.

### S-03 Product detail `/products/:slug`

```text
Breadcrumb: Home / Category / Product
┌──────────────────────┬──────────────────────────────────┐
│                      │ Product name                     │
│   Primary image      │ Category · SKU                   │
│                      │ $19.99                           │
│   Thumbnail row      │ ● In stock (14 available)        │
│                      │ Description paragraph            │
│                      │ [ Add to cart ]  [ Back ]        │
└──────────────────────┴──────────────────────────────────┘
```
- Stock shown as "In stock", "Low stock (n left)" when `stock ≤ 5`, or "Sold out".
- Add to cart disabled when sold out; guest click opens login with return URL (BR-04). Authenticated admins see no Add to cart control.
- Multiple image URLs render as thumbnails with a selected-image state; broken images fall back to a neutral placeholder.
- Rules surfaced: BR-01, BR-02, BR-04, BR-19.

### S-04 Login / Register

- Centred 420 px card on a light background; at `md+` a two-column split with brand panel on the left.
- Fields: email, password; registration adds name and confirm password.
- Password requirements shown as helper text; errors inline per field.
- Links: "Already have an account? Log in" / "Create an account".
- Note under form: "Admin accounts are provisioned by the store owner." (BR-15)
- No password-reset link is shown in the MVP; account recovery is deferred.
- On success, redirect per the role rules in `APP-FLOW.md`.

### S-05 Cart `/cart`

```text
┌──────────────────────────────────────┬───────────────────┐
│ Your cart (3 items)                  │ Order summary     │
│ ┌────┬───────────────┬─────┬──────┐  │ Subtotal  $59.97  │
│ │img │ Product name  │ − 2 +│ $39.98│  │ Shipping  $0.00   │
│ └────┴───────────────┴─────┴──────┘  │ Tax       $0.00   │
│ [Remove]                             │ ───────────────   │
│ ...                                  │ Total     $59.97  │
│                                      │ [ Checkout ]      │
└──────────────────────────────────────┴───────────────────┘
```
- Quantity stepper clamps to 1…99 and to available stock; the "+" disables at the cap with a tooltip.
- Summary is fetched from `GET /api/cart`; never computed locally for display (BR-02, BR-08).
- Line warning appears if stock dropped since the item was added.
- Empty state: "Your cart is empty" + "Browse products".
- Mobile: summary panel moves below the item list and becomes sticky at the bottom.

### S-06 Checkout `/checkout`

- Two-column layout: shipping address form left, read-only order summary right.
- Address fields: full name, phone, address line 1, line 2 (optional), city, state (optional), postal code, country.
- Single primary action "Place order — $59.97"; secondary "Back to cart".
- Explicit microcopy: "This is a demo store. No payment will be collected." (BR-07)
- Submit disabled while in flight; duplicate clicks prevented client-side and by the idempotency key server-side (BR-18).
- On 409 stock error: top alert with message and "Return to cart", cart untouched.
- Mobile: summary collapses into an expandable section above the submit button.

### S-07 Order confirmation `/order-confirmation/:id`

- Success alert with checkmark icon: "Order placed".
- Shows order number, total, and status `PAID`.
- Actions: "View order details", "Continue shopping".
- No payment receipt language; no card details (BR-07).

### S-08 Order history `/orders`

- Table on desktop: Order number, Date, Items, Total, Status badge, "View".
- Cards on mobile with the same fields stacked.
- Newest first, paginated; status filter optional.
- Empty state: "No orders yet" + "Browse products".

### S-09 Order detail `/orders/:id`

- Header: order number, placed date, status badge.
- Sections: item snapshots (name, unit price, qty, line total), shipping address, totals breakdown, timeline.
- Timeline entries show status, actor type (`SYSTEM`/`CUSTOMER`/`ADMIN`), and timestamp (BR-12, BR-13).
- "Cancel order" button with confirm dialog only when status is `PAID` (BR-11); `PENDING_PAYMENT` is internal only and never appears. Otherwise the action is hidden, not merely disabled.
- Soft-deleted products still render from snapshots with a "No longer available" muted note (BR-14).

### S-10 Utility pages

- `/forbidden`: 403 illustration-free panel, "You do not have access to this area", link back to the correct home.
- `*` 404: "Page not found" with link to Products.

### Admin shell (A-00)

```text
┌──────────┬─────────────────────────────────────────────┐
│ Cartly   │ Products      Admin · name        [Logout] │
│ Admin    ├───────────────┬─────────────────────────────┤
│          │ ▸ Dashboard   │  Page content               │
│          │ ▸ Products    │                             │
│          │ ▸ Categories  │                             │
│          │ ▸ Settings    │                             │
│          │ ▸ Orders      │                             │
└──────────┴───────────────┴─────────────────────────────┘
```
- Sidebar 240 px fixed on `lg+`; collapses to a top hamburger drawer on smaller screens.
- Active nav item uses brand tint background and left accent bar.
- Admin screens use the same card/table primitives as the storefront for consistency.

### A-01 Admin dashboard `/admin`

- Four summary cards: product count, active product count, order count, orders needing attention (non-terminal statuses).
- Shortcuts: "Add product", "View orders", "Shipping settings".
- No charts in MVP (analytics deferred to P2, BR-20).

### A-02 Admin products `/admin/products`

- Table columns: Image thumbnail, Name, SKU, Category, Price, Stock, Status (Active/Inactive/Deleted), Actions (Edit, Delete).
- Filters: search by name, category, status; pagination.
- Stock ≤ 5 shows amber "Low" tag; `stock = 0` shows rose "Out".
- Delete opens confirm dialog: "This hides the product from the store. Existing orders keep their records." (BR-14)

### A-03 Product form `/admin/products/new`, `/admin/products/:id/edit`

- Two-column form: main fields left, publish options right.
- Fields: name, slug (auto-generated from name, editable), description, price (dollars input, stored as cents), stock (integer), SKU (optional), category select, image URLs (repeatable field, add/remove rows), active toggle.
- Validation feedback: unique slug/SKU errors shown next to the field; image URL must start with `http://` or `https://` (BR-17).
- Footer actions: Save, Cancel; unsaved-changes guard on navigation.

### A-04 Categories `/admin/categories`

- Table: Name, Slug, Product count, Actions (Edit, Delete).
- Delete of a referenced category is refused by the server; UI shows a 409 banner "Category is used by N products" (BR-14).

### A-05 Category form

- Fields: name, slug, description; Save/Cancel; same validation pattern as product form.

### A-06 Settings `/admin/settings/shipping`, `/admin/settings/tax`

- Shipping: flat fee (dollars → cents), free-above amount (dollars → cents, blank = never), active toggle.
- Tax: percentage with up to two decimals (stored as basis points), active toggle.
- Informational note: "Changes affect new carts and new orders only. Existing orders keep their original totals." (BR-13)
- Single Save action per form with success toast.

### A-07 Admin orders `/admin/orders`

- Table: Order number, Customer, Date, Items, Total, Status badge, "Open".
- Filters: status, customer name/email, date range optional.
- Rows with non-terminal statuses (`PAID`, `PROCESSING`, `SHIPPED`) are marked with a neutral "needs attention" dot (no automated escalation).

### A-08 Admin order detail `/admin/orders/:id`

- Same content structure as S-09 plus customer identity and the allowed forward transition action.
- Button label reflects the transition: "Mark as processing", "Mark as shipped", "Mark as delivered"; "Cancel order" available from `PAID` only.
- Invalid or stale state shows a 409 banner listing allowed next states and refreshes the detail (BR-11).

---

## 7. Responsive behaviour summary

| Area | Mobile (375 px) | Tablet (768 px) | Desktop (1440 px) |
|---|---|---|---|
| Header | Logo + search icon + cart icon | Search field visible | Full nav with orders and account menu |
| Catalog | 2-column grid, filter slide-over | 3-column grid, filter rail appears | 4-column grid + 240 px filter rail |
| Cart | Stacked items, sticky summary footer | 2-column layout | 2-column with 320 px summary |
| Checkout | Single column, collapsible summary | Two columns, narrower summary | Two columns, 380 px summary |
| Tables | Converted to stacked cards | Horizontal scroll allowed | Full tables |
| Admin shell | Hamburger drawer | Collapsed sidebar | Fixed 240 px sidebar |

---

## 8. Accessibility requirements

- WCAG 2.1 AA contrast; body text minimum 4.5:1, large text 3:1.
- Every interactive element reachable and operable by keyboard; visible focus ring (BR-19-adjacent quality target).
- Form inputs have persistent visible labels; errors associated via `aria-describedby`.
- Status is conveyed by text plus colour, never colour alone.
- Modals trap focus, close on Escape, and restore focus to the trigger.
- Toasts use `aria-live="polite"`; errors use `role="alert"`.
- Skeleton placeholders expose `aria-busy` on the loading container.
- Touch targets at least 44 × 44 px on mobile.

---

## 9. Business rules expressed visually

| Rule | UI expression |
|---|---|
| BR-01 | Inactive/deleted products absent from storefront; admin sees status tags |
| BR-02 | Prices and totals always rendered from API responses |
| BR-03 | Search/filter/sort controls with URL state and result count |
| BR-04 | Guest add-to-cart triggers login screen with return intent |
| BR-05 | Quantity stepper bounded by 1…99 and stock; disabled "+" at cap |
| BR-06 | Sold-out badge and checkout 409 alert with intact cart |
| BR-07 | "Demo store — no payment collected" copy on checkout; `PAID` badge |
| BR-08 | Itemised subtotal / shipping / tax / total summary everywhere totals appear |
| BR-09 / BR-10 | Admin settings forms with scoped "new orders only" note |
| BR-11 | Status badge plus allowed forward action and cancel where permitted; invalid transition banner |
| BR-12 | Order timeline with actor and timestamp |
| BR-13 | Customer order pages scoped to own orders; immutable item snapshots |
| BR-14 | Delete confirmations; "No longer available" note on historic items |
| BR-15 | No role selector on auth screens; admin note on register form |
| BR-16 | Session expiry recovery without losing current page |
| BR-17 | Inline validation for URLs, integers, and cents inputs |
| BR-18 | Submit button disabled during request; duplicate response reuses the customer's existing order |
| BR-19 | USD formatting (`$1,234.56`) and English copy throughout |

---

## 10. Expected output

This brief produces:

1. A token-based design system with colour, type, spacing, layout, and component specifications mappable to Tailwind classes.
2. Detailed desktop and mobile layouts for 10 storefront screens and 9 admin screens, including the shared chrome.
3. Defined loading, empty, error, disabled, and success states for every screen.
4. Accessibility requirements at WCAG 2.1 AA level and an explicit responsive behaviour matrix.
5. A direct visual mapping for BR-01 … BR-20, keeping the UI consistent with `PRD.md`, `TRD.md`, `APP-FLOW.md`, and `BACKEND-SCHEMA.md`.

**No implementation code is produced by this document.**
