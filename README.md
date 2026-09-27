# Lura Energy platform

TypeScript full-stack website using Next.js, PostgreSQL, Prisma, and server-managed administrator sessions.

## Local setup

1. Install Node.js 22.6 or later and Docker Desktop.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set a private `SESSION_SECRET` with at least 32 random bytes. Set `APP_URL` for the chosen local or production origin.
4. Start PostgreSQL with `docker compose up -d database` or configure a hosted PostgreSQL URL in `DATABASE_URL`.
5. Apply migrations with `npm run db:migrate`.
6. Initialize the owner seat limit and default settings with `npm run db:seed`.
7. Set `OWNER_EMAIL`, `OWNER_NAME`, and a unique `OWNER_PASSWORD` of at least 12 characters in the current PowerShell session, then run `npm run admin:create`. The command creates only the first owner.
8. Start the site with `npm run dev` and open the origin configured in `APP_URL`.

### Visual preview without PostgreSQL

For a local visual review only, set `PREVIEW_WITHOUT_DATABASE="true"` in `.env` while `NODE_ENV` is `development`. Public pages render their normal layout with published-record areas empty, and quote submissions are disabled. Product, project, and other record detail pages return not found until a database is connected. Remove the setting (or set it to `false`) after starting PostgreSQL and applying migrations. This option has no effect in production.

## Operations

- `npm run db:migrate` applies committed SQL migrations to the configured database.
- `npm run db:seed` inserts the initial six-seat capacity. It does not insert fabricated business records.
- `npm run admin:create` bootstraps the first OWNER using one-time environment variables.
- `npm run typecheck` runs TypeScript checks.
- `npm test` runs focused permission-policy unit tests.
- `npm run build` creates the production build.
- `npm start` serves the production build.

Set `APP_URL` to the public HTTPS origin in production. Use a trusted reverse proxy that overwrites `X-Forwarded-For`, enable database backups, and keep secrets outside the repository. No email provider is configured; the OWNER receives a one-time invitation URL from the administrator screen and must deliver it through an approved channel.

See [required-lura-information.md](docs/required-lura-information.md) for approved content and deployment inputs needed before launch.
