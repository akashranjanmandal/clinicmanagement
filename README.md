# Clinic Management

A clinic appointment-booking and management app built with Next.js, TypeScript, Tailwind CSS, Turso (LibSQL), and Drizzle ORM. The public landing page is intentionally focused on appointment booking and has no navigation bar or city-specific content.

## Requirements

- Node.js 20.9 or later
- npm
- A Turso database for shared/production data, or a local LibSQL database for development

## Environments

| File | Used by | Database |
| --- | --- | --- |
| `.env.development.local` | `npm run dev` | local SQLite (`file:local.db`) + dummy data |
| `.env.production.local` | `npm run build` / `npm start` (local prod test) | Turso |
| Hosting dashboard (e.g. Vercel) | deployed app | Turso |

All real env files are gitignored; `.env.example` lists every variable. Generate secrets with `openssl rand -base64 48`.

### Development

```bash
npm install
cp .env.example .env.development.local   # set AUTH_SECRET, SEED_DEMO_DATA=true, SEED_ADMIN_*
npm run db:setup:local                    # migrate + dummy data
npm run dev
```

### Production

```bash
cp .env.example .env.production.local     # Turso URL/token, AUTH_SECRET, site URL, ADMIN_*
npm run db:migrate:prod                   # apply schema to Turso
npm run db:create-admin:prod              # first super-admin (password >= 12 chars)
npm run build && npm start
```

Admin sign-in is at `/admin/login`. Passwords are bcrypt-hashed; the session is a signed, HTTP-only cookie (secure in production). Never commit env files or share tokens.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso `libsql://...` URL or local `file:...` database |
| `TURSO_AUTH_TOKEN` | Turso database token; leave empty for local file databases |
| `AUTH_SECRET` | At least 32 characters; signs admin sessions and HMACs rate-limit keys |
| `NEXT_PUBLIC_SITE_URL` | Public origin used for metadata and sitemap |
| `NEXT_PUBLIC_MAPS_EMBED_URL` | Optional, clinic-specific Google Maps embed URL |
| `SEED_DEMO_DATA` | Must be `true` to enable development seed data |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD` | Optional development admin created by the seed command |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | One-time admin bootstrap inputs for `db:create-admin` |

The Turso token previously pasted into the chat is exposed; revoke it in Turso and issue a new token before configuring this app.
Any admin password shared in chat is also exposed; do not use it for the admin account. Choose a new password privately in `.env.local`.

## Main functionality

- Public landing page focused on doctor/date/time appointment requests.
- Doctor and service pages read from Turso; no production doctor/service data is hardcoded.
- Doctor-specific weekly schedules, clinic holidays, leave ranges, consultation lengths, and slot intervals.
- Server-side Zod validation, atomic slot uniqueness, pending-by-default bookings, and UTC appointment timestamps alongside clinic-local schedule keys.
- Contact message submissions stored in Turso.
- Protected admin management for doctors, schedules, leave periods, holidays, departments, services, contact messages, clinic settings, and admin users.
- Searchable/paginated appointment management with status updates and audit log entries.
- HMAC-hashed, database-backed fixed-window rate limits for login, booking, contact, and availability endpoints.
- Sitemap and robots metadata; admin and booking-form routes are not indexed.

Public booking and contact submissions require a configured database. Without active doctors, the booking controls remain disabled and show a short, patient-friendly availability message rather than fake records.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Configuration still needed before launch

- Set the real clinic name, timezone, contact details, maps URL, doctors, schedules, services, and clinic holidays in the database.
- Review the deployment proxy's client-IP headers so rate limits use trusted values.
- Configure persistent doctor image hosting; profile image URLs can currently be managed, but binary upload is not implemented.
- Review patient-data retention, access policies, backups, and jurisdiction-specific privacy requirements before production use.
