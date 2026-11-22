# Cartly Agent Instructions

Read this file in full before every development task.

## Project identity

This repository is the implementation workspace for **Cartly**, a single-store online shopping platform. The approved product and technical planning documents live in `docs/`.

## Structure

- `frontend/` — React + Vite + TypeScript + Tailwind CSS storefront scaffold.
- `backend/` — Node.js + Express + TypeScript + Prisma API scaffold.
- `docs/` — PRD, TRD, app flow, UI/UX brief, backend schema, and review report.

The approved TRD uses the logical names `client/` and `server/`; this workspace uses `frontend/` and `backend/` per the requested folder structure. Treat them as equivalent.

## Current status

Scaffold only. Do **not** implement application features until explicitly asked. Current code is limited to:

- a placeholder storefront shell,
- an Express `/api/health` endpoint,
- Prisma datasource configuration with no models.

## Commands

Run all commands from the repository root unless stated otherwise.

| Task | Command |
|---|---|
| Install frontend | `npm install --prefix frontend` |
| Install backend | `npm install --prefix backend` |
| Start frontend | `npm run dev:frontend` |
| Start backend | `npm run dev:backend` |
| Build both | `npm run build` |
| Generate Prisma client | `npm --prefix backend run prisma:generate` |
| Backend typecheck | `npm run typecheck:backend` |

## Conventions

- TypeScript in both packages; strict mode in the backend.
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin; no separate PostCSS config.
- Prisma is pinned to 6.12.0 in both `prisma` and `@prisma/client` for a clean audit and the documented `schema.prisma`/migrations workflow.
- Backend port defaults to `4000`; frontend port is `5173`.
- Environment templates are `backend/.env.example` and `frontend/.env.example`; local `.env` files are ignored.
- All business rules BR-01 … BR-20 are defined in `docs/PRD.md` and must be traced before implementing any feature.
- Security requirements, API contract, and test plan are defined in `docs/TRD.md`.
- Screens and navigation are defined in `docs/UI-UX-BRIEF.md` and `docs/APP-FLOW.md`.
- Data model is defined in `docs/BACKEND-SCHEMA.md`.

## Development rules

1. Follow the approved project documentation in `docs/` before making decisions or writing code.
2. Use reusable React components in `frontend/`; avoid duplicating UI logic across screens.
3. Keep frontend and backend separate: UI code belongs in `frontend/`, API and data code belongs in `backend/`.
4. Use REST APIs for all frontend-to-backend communication.
5. Use Prisma for all database operations; do not bypass it with ad hoc SQL.
6. Follow consistent naming conventions for files, folders, components, functions, routes, database fields, and environment variables.
7. Validate every request input on the server, even when the frontend also validates it.
8. Handle errors properly with clear client-safe messages and without leaking stack traces or internal details.
9. Never expose secret keys, passwords, or private credentials in frontend code or committed files.
10. Enforce admin permissions on the server for every admin-only action; never rely on frontend checks alone.
11. Write tests for every important feature, including happy paths, validation failures, and authorization failures.
12. Avoid unnecessary dependencies; prefer existing libraries and utilities already used in the project.
13. Do not modify unrelated files or change behavior outside the requested task.
14. Explain important code changes in the final response, including what changed and why.
15. Do not add product features, routes, or database models without an explicit request.
16. Do not change BR-01 … BR-20 or the approved decisions without asking.
17. Keep secrets out of source control; `.env` files are ignored and contain development placeholders only.
18. Run `npm run typecheck:backend` and `npm run build` before reporting completion of any future change.
