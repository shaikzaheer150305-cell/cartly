# Cartly production deployment

No deployment is performed by this document. Obtain explicit approval before releasing to any live environment.

## Recommended services

| Layer | Recommended | Alternatives |
|---|---|---|
| Frontend | Vercel | Netlify, Cloudflare Pages |
| Backend | Render Web Service | Fly.io, Railway, Google Cloud Run, AWS ECS Fargate |
| PostgreSQL | Neon | Supabase, AWS RDS/Aurora, Google Cloud SQL, Render Postgres |

Choose services in the same region. Enable managed backups and point-in-time recovery for PostgreSQL.

## Production topology

- Frontend serves the static Vite build from `frontend/dist`.
- Backend runs the compiled Express app from `backend/dist` with `node dist/index.js`.
- PostgreSQL uses a pooled connection for runtime and a direct connection for migrations.
- Prefer a same-origin `/api` rewrite from the web host to the API host. This keeps the refresh cookie first-party and avoids cross-site cookie restrictions.
- CORS allows only the exact `WEB_ORIGIN` with credentials enabled.

## Environment variables

Never commit `.env` files or secret values. Inject values through the hosting platform's secret manager. Generate random values with a local command such as `openssl rand -base64 48`; do not paste them into tickets or chat.

### Backend

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL URL used by the API and Prisma client |
| `DIRECT_URL` | Direct PostgreSQL URL used by Prisma migrations |
| `WEB_ORIGIN` | Exact HTTPS web origin, for example `https://shop.example.com` |
| `JWT_ACCESS_SECRET` | Unique long random access-token signing secret |
| `JWT_REFRESH_SECRET` | Different unique long random refresh-token secret |
| `NODE_ENV` | Must be `production` |
| `PORT` | HTTP port supplied by the platform |
| `TRUST_PROXY` | Number of trusted proxy hops; usually `1` behind a managed proxy |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Initial admin used only by the seed step |
| `SEED_CUSTOMER_EMAIL`, `SEED_CUSTOMER_PASSWORD`, `SEED_CUSTOMER_NAME` | Optional seeded test customer |
| `APP_CURRENCY` | Must be `USD` |
| `SHIPPING_FLAT_FEE_CENTS`, `FREE_SHIPPING_THRESHOLD_CENTS`, `SHIPPING_IS_ACTIVE` | Shipping policy |
| `TAX_PERCENT_BPS`, `TAX_IS_ACTIVE` | Tax policy |

Startup aborts in production when required values are missing, weak, duplicated, or when `WEB_ORIGIN` is not HTTPS. Error messages name variables only and never print their values.

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Set to `/api` when using the same-origin rewrite; otherwise set to the exact HTTPS API base URL |

`VITE_API_URL` is embedded at build time, so set it before building the frontend.

## Build and verification

Run from the repository root:

```bash
npm ci --prefix frontend
npm ci --prefix backend
npm --prefix backend run prisma:generate
npm run typecheck:backend
npm run lint:frontend
npm run test:backend
npm run test:frontend
npm run build
```

The production artifacts are `frontend/dist` and `backend/dist`.

## Database setup

1. Create a managed PostgreSQL 16 database with SSL required and PITR enabled.
2. Create separate runtime and migration users where the platform supports it.
3. Set `DATABASE_URL` to the pooled connection string with `pgbouncer=true&connection_limit=1`.
4. Set `DIRECT_URL` to the direct non-pooled connection string.
5. Run migrations as a release step before starting the new API version:

```bash
npm --prefix backend run prisma:deploy
npm --prefix backend run prisma:status
```

6. Seed only once for the initial admin:

```bash
npm --prefix backend run db:seed
```

The seed step requires all seed environment variables and no longer uses built-in development credentials.

## Backend deployment

1. Use Node 24 or newer.
2. Set `NODE_ENV=production`.
3. Start with `npm --prefix backend run start`.
4. Expose only the backend HTTPS port through the platform.
5. Configure `TRUST_PROXY` so rate limiting sees the real client IP.
6. Ensure the platform terminates TLS and redirects HTTP to HTTPS.
7. Keep HSTS enabled; the app sends HSTS through Helmet in production.

Production security behavior:

- Refresh cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
- CSRF origin and referer checks apply to all `POST`, `PATCH`, and `DELETE` requests.
- Auth and checkout endpoints are limited to 10 requests per minute per client IP.
- All request bodies, params, and queries are validated on the server.
- Prisma parameterized queries are used for application data access.
- 500 responses are generic; stacks are logged only outside production.
- Every response includes `X-Request-Id` for support correlation.

## Frontend deployment

For Vercel, add a project rewrite so the browser calls the API through the web origin:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://BACKEND_HOST/api/:path*" }
  ]
}
```

Set `VITE_API_URL=/api` before building.

For Netlify, use `_redirects`:

```text
/api/*  https://BACKEND_HOST/api/:splat  200
/*      /index.html                     200
```

Enable SPA fallback routing so client-side routes such as `/admin/orders` load correctly.

## Post-deployment verification

1. `GET /api/health` returns HTTP 200 with `database: "connected"`.
2. Register a customer and confirm login works.
3. Log in with the seeded admin through `/api/auth/admin/login`.
4. Create a category and product, then confirm they appear in the storefront.
5. Add to cart, check out, and confirm stock decrements and order history renders.
6. Confirm admin-only endpoints reject customer tokens.
7. Confirm an unauthenticated write returns 401 and a cross-origin write returns 403.
8. Confirm invalid bodies return 400 and duplicate values return 409.
9. Confirm browser dev tools show no `Secure` cookie warnings and no cross-site cookie blocks.
10. Confirm 375 px and 1440 px layouts have no horizontal scroll.
11. Confirm a forced backend error returns only a generic client-safe message.

## Rollback

- Roll back the application release first.
- Do not automatically roll back migrations; verify data integrity with `prisma migrate status`.
- Use managed PostgreSQL PITR for data-level recovery.
- Keep the previous frontend and backend build artifacts available for redeploy.

## Approval gate

Deploy only after explicit approval naming the target environment and chosen services.
