# GitHub and deployment

## Recommended hackathon configuration

Deploy in **demo mode** with Supabase variables unset. The production build works
without an account provider, database, sensor hardware, or private keys. All
occupancy and forecast data must be described as simulated.

Use Node.js 24 (pinned in package.json, .nvmrc, and netlify.toml).
Commit package-lock.json and install with `npm ci`.

## GitHub contents

Commit source, public assets, package.json, package-lock.json, next.config.ts,
TypeScript/ESLint configuration, vercel.json, netlify.toml, .nvmrc, .env.example,
Supabase schema/migrations, tests, and documentation.

The .gitignore excludes node_modules, .next, local build output, .env files,
hosting account metadata, logs, local audit output, and editor caches.
The blank .env.example is explicitly included. Never put real credentials in it.
Ignoring a file does not remove it from existing Git history.

The Git repository is the CampusPulse directory containing package.json.
If you instead create a repository containing the entire CyrusHackathon folder,
the application root is `github/CampusPulse`.

## Vercel

1. Import the GitHub repository.
2. Set Root Directory to the directory containing package.json:
   repository root for CampusPulse, or `github/CampusPulse` for the parent folder.
3. Select the Next.js framework preset and Node.js 24.
4. vercel.json supplies `npm ci` and `npm run build`.
5. Leave Output Directory at the Next.js default. This app requires server
   functions; do not select a static export or an `out` directory.
6. Leave all Supabase environment variables unset for the hackathon demo.
7. After deployment, exercise /demo, /map, /reservations, and /notifications.
   Actual hosting deployment has not been performed by this audit.

## Netlify

Set the Base directory to the same application directory and allow Netlify to
use its automatic Next.js adapter. netlify.toml supplies the build command,
Node.js version, and .next publish directory. Do not add an SPA catch-all
redirect: Next.js must handle API endpoints and authentication callbacks.

## How demo persistence works

- Reservations, alerts, and preferences use local storage on the site origin.
- Simulated occupancy, simulator status, and the latest four sensor events use
  validated HTTP-only cookies, valid for 24 hours.
- Cookies carry the demo state between serverless requests; server memory and
  background server timers are not required.
- Keep **one** admin or guided-demo tab open to drive automatic simulation ticks.
  Closing it pauses updates. Returning while the simulator is marked running
  resumes them.
- Tabs on the same origin share data; another browser/device has a separate demo.
  This is not a shared campus database or cross-device realtime system.
- Cookies contain sample simulation values, not authentication authority.

## Optional Supabase integration: unfinished production work

Use .env.example as a variable-name reference. Set the project URL and public
anon key through the host's environment dashboard. The service-role key is
server-only and must never receive a NEXT_PUBLIC prefix.

For a fresh database, inspect and apply supabase/schema.sql and seed data using
BACKEND_SETUP.md. For an existing database, apply
supabase/migrations/20261007_profile_permissions.sql. These SQL changes have
**not** been executed against a live database by this audit.

Configure Supabase Site URL and allowed redirects for the final domain,
including `https://YOUR_DOMAIN/auth/callback`. Recovery returns to
/reset-password. Rebuild after changing NEXT_PUBLIC variables.

Before accepting real users, connect the current browser-local reservation,
notification, and preference UI to the database APIs, enforce atomic capacity
and seat allocation in database transactions, restrict direct reservation
writes, and verify Auth/email delivery, RLS, and realtime with multiple accounts.
The existing optional API scaffolding is not a finished live booking service.
Do not enable real campus bookings just by adding keys.

## Local release checks

```bash
npm ci
npm run build
npm run start -- --port 3100
# Separate terminal:
npm run test:smoke
npm run lint
```

The smoke checks require demo mode and refuse to run against live Supabase data.
Lint findings are recorded in AUDIT_REPORT.md; the build does not conceal them.

## Hosting references

- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel build and root settings](https://vercel.com/docs/builds/configure-a-build)
- [Netlify Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
