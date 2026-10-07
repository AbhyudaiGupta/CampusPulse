# CampusPulse

CampusPulse helps students find a suitable campus space before they walk there, while giving facilities teams a view of crowding and practical ways to respond.

The project is a hackathon prototype. Occupancy and forecasts use demo or simulated data unless a Supabase project and real sensor feed are configured.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The student dashboard is the home page. The app works in demo mode without Supabase credentials.

## Demo walkthrough

- `/demo` — guided two-minute presentation with scenario actions.
- `/admin` — campus operations view with occupancy scenarios and the capacity planner.
- `/` — student dashboard.

Demo actions for a persona persist in that browser and sync between tabs, so a reservation or alert remains visible after a reload. The reset control returns the occupancy simulation and presentation steps to their baseline.

## Student experience

- Browse current occupancy, facilities, and forecasts across campus spaces.
- Compare recommendations using activity, noise, accessibility, and walking preferences.
- Hold a desk for ten minutes, check in to start the selected one-to-four-hour session, or release the seat.
- Review active reservations, reservation history, and in-app alerts.
- Manage profile and privacy preferences.

## Main routes

| Route | Purpose |
| --- | --- |
| `/spaces` and `/spaces/[id]` | Browse spaces and inspect availability |
| `/map` | Explore the campus map |
| `/recommendation` | Find a space matching a study session |
| `/reservations` | Manage holds, check-ins, and history |
| `/notifications` | Read crowd and reservation alerts |
| `/profile` and `/privacy` | Manage preferences and privacy information |
| `/admin` | Review campus occupancy and operational scenarios |

## Data and integrations

Without Supabase configuration, the site uses demo data. Demo reservations, alerts, and preferences are stored in browser local storage. Occupancy changes in the guided admin demo are simulated and stored in validated browser-scoped cookies. Keep one admin or guided-demo tab open while running the simulator. Separate browsers have independent simulations.

For Supabase Auth and PostgreSQL setup details, follow [BACKEND_SETUP.md](./BACKEND_SETUP.md). Before using a live deployment, connect reservation actions to the database and verify the campus occupancy source and database policies; demo sensor values should not be presented as actual campus telemetry.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase (optional), Recharts, an SVG campus map, and Framer Motion.

## Deployment and verification

Use Node.js 24. See [DEPLOYMENT.md](./DEPLOYMENT.md) for GitHub, Vercel, Netlify, and environment setup, and [AUDIT_REPORT.md](./AUDIT_REPORT.md) for verified behavior and remaining integration work.

```bash
npm run build
npm run start -- --port 3100
# In another terminal, with the demo server running:
npm run test:smoke
```

The smoke script refuses to mutate a configured Supabase database.
