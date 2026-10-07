# CampusPulse submission audit

## Status

**Hackathon demo: ready.** The production build passes and the demo mode was
tested against a production server. The project is not yet a live campus
operations system: real Supabase credentials, database migration, sensor feed,
and multi-account testing are still required before real bookings or telemetry.

## Verified

- Optimized Next.js production build succeeds with TypeScript checks.
- 41 production HTTP checks pass in demo mode: all principal pages, unknown
  routes, validation failures, malformed JSON, occupancy updates, per-browser
  simulation isolation, simulator start/tick/stop/reset, recommendations, and
  advisory preview.
- Browser checks cover responsive recommendation results, notification
  read-state, map hold, check-in, release, and reservation history.
- The supplied Vercel and Netlify configuration targets Node.js 24 and preserves
  dynamic Next.js routes and API handlers.
- Git ignore rules exclude local secrets and generated files while retaining
  deployment configuration, lockfile, schema, migrations, documentation, and
  test source.

## Fixed during audit

- Replaced server-memory demo occupancy and timer assumptions with validated,
  browser-scoped cookies suited to serverless requests.
- Made map reservations use the same real demo hold state as Reservations,
  added the missing alert feedback, and prevented a repeated check-in.
- Corrected occupancy thresholds, forecast matching, mobile navigation typing,
  keyboard interaction on the map, and recommendation filters.
- Ensured a dining request returns a dining space and clears study-only power
  requirements when the activity changes.
- Added safe API error responses, password reset route, callback validation,
  and a profile role-escalation database permission fix.
- Added deployment configuration, environment template, Node version pin,
  smoke test, and deployment guidance.

## Remaining work before real users

- Do not add Supabase variables to represent a live product without completing
  the explicit production checklist in DEPLOYMENT.md.
- The on-screen student demo state remains local to a browser. It is intentionally
  not shared between devices in demo mode.
- The simulator advances only while a guided-demo or admin page remains open.
- Apply the new Supabase migration to existing databases, configure allowed
  callback URLs, then test real Auth, RLS, email recovery, atomic reservations,
  and realtime with multiple accounts.
- The presentation still contains team-name placeholders and a stale external
  demo URL. Replace them with your actual names and final deployment address.

## Lint

`npm run lint` currently reports 40 errors and 130 warnings across legacy
components and hooks, mostly strict React hook and explicit-any findings. They
do not block `next build`, and no ESLint rules were disabled to conceal them.
They should be addressed as a separate cleanup pass rather than rushed before
the hackathon demo.

## Release commands

```bash
npm ci
npm run build
npm run start -- --port 3100
# Separate terminal
npm run test:smoke
```
