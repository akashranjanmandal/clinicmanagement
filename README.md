# Clinic Management

A clinic appointment-booking and management app built with Next.js, TypeScript, Tailwind CSS, Turso (LibSQL), and Drizzle ORM. The public landing page is intentionally focused on appointment booking and has no navigation bar or city-specific content.

## Requirements

- Node.js 20.9 or later
- npm
- A Turso database for shared/production data, or a local LibSQL database for development

## Environment

One env, using the real Turso database (no local database). Copy `.env.example` to `.env.local` (gitignored) and fill it in. On Netlify, add the same variables under Site configuration → Environment variables.

```bash
npm install
npm run db:migrate         # apply schema to Turso
npm run db:create-admin    # first admin (reads ADMIN_* from .env.local)
npm run dev                # local development (uses the same Turso database)
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
