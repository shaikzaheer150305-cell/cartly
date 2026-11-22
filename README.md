# Cartly

Cartly is a responsive demo storefront for thoughtfully selected everyday clothing, shoes, and accessories. The customer shopping flow runs entirely in the browser: it uses sample catalog data, keeps the cart and wishlist in `localStorage`, and places demo orders without sending address or payment details to a server.

## Storefront features

- Responsive home page, category navigation, product search, and product cards with imagery and image fallbacks.
- Shop filters for category, price, size, and color, plus featured, newest, and price sorting.
- Product detail pages with image galleries, color and size selection, stock-aware quantities, related items, and wishlist controls.
- Cart drawer and cart page with editable quantities, shipping estimates, and Indian rupee pricing.
- Validated demo checkout and local order confirmation. No payment information is requested or stored.
- Persistent cart and wishlist, newsletter email validation, and accessible mobile drawers.

## Tech stack

- React, TypeScript, Vite, and Tailwind CSS v4
- React Router for client-side routes
- Local sample catalog and browser `localStorage` for the demo storefront
- Express, TypeScript, and Prisma folders are also included for the separate API scaffold.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Run locally

From the project root:

```bash
npm ci --prefix frontend
npm run dev:frontend
```

Open `http://localhost:5173/`.

## Build and lint

```bash
npm --prefix frontend run build
npm run lint:frontend
```

The production storefront files are written to `frontend/dist/`.

## Render static site

The root [`render.yaml`](render.yaml) configures the Vite storefront as a Render Static Site. It builds from `frontend/`, publishes `dist/`, and rewrites client-side routes to `index.html`.

Connect this repository to Render and create a Blueprint from the root `render.yaml`. The storefront does not require a backend service for its demo shopping flow. The separate Express/Prisma API scaffold is not connected to this customer storefront.

## Project structure

```text
frontend/   React storefront and Vite configuration
backend/    Express and Prisma API scaffold
docs/       Product, technical, UI, flow, and data-model documentation
render.yaml Render Static Site Blueprint
```

Local `.env` files, dependency folders, and build output are ignored by Git. Do not commit real credentials or secrets.
