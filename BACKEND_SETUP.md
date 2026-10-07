# CampusPulse Backend Setup and Security Guide

This document outlines the architecture, setup procedure, security model, and API documentation for CampusPulse with Supabase PostgreSQL, Row Level Security (RLS), and Next.js server route handlers.

---

## 1. Architecture and Security Principles

CampusPulse is designed with a **privacy-first and zero-trust** backend architecture:

1. **Client Isolation**:
   - Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed in browser code.
   - `SUPABASE_SERVICE_ROLE_KEY` is **never** accessible client-side and is only accessed in secure server-side route handlers.
2. **Server-Side Session Verification**:
   - User identity (`user_id`) is strictly extracted from verified session cookies via `auth.getUser()`.
   - Client-supplied `userId` fields in request bodies or query parameters are **never** trusted.
3. **Role-Based Access Control**:
   - `admin` role operations (such as occupancy telemetry updates or capacity simulator writes) are validated on the server by checking `profiles.role = 'admin'`.
   - Non-admin users are rejected with HTTP 403 Forbidden.
4. **Row Level Security (RLS)**:
   - All PostgreSQL tables have RLS enabled.
   - Direct public writes are blocked.
   - Students can only view and update their own reservations, alerts, and notifications.
   - Sensor telemetry logs are restricted to campus administrators.
5. **Overbooking Prevention & 10-Minute Hold Window**:
   - When a student reserves a seat, the backend re-calculates available seats against capacity and active holds.
   - Holds automatically expire after 10 minutes (`expires_at = now() + interval '10 minutes'`).
   - If available seats are zero or less, the request is rejected with HTTP 409 Conflict.
6. **Graceful Demo Mode**:
   - When Supabase environment variables are unconfigured, all endpoints and client views fall back to mock demo data without crashing.

---

## 2. Environment Variables

Create or update `.env.local` in the project root (`campuspulse/.env.local`).

> [!CAUTION]
> Never commit `.env.local` to version control. The `SUPABASE_SERVICE_ROLE_KEY` grants full database bypass and must remain secret.

```env
# Browser and Client-Side Accessible
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Server-Side Only (Never prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## 3. Database Schema Installation

The complete production PostgreSQL schema is located in `supabase/schema.sql`.

### Steps:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and navigate to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it.

### Schema Summary:
- **`profiles`**: Linked to `auth.users(id)`. Stores `full_name`, `role` (`student` or `admin`), `avatar_url`, and preferences.
- **`spaces`**: Master catalog of campus facilities (coordinates, capacity, Wi-Fi, power, accessibility).
- **`live_occupancy`**: Real-time state (occupied count, queue length, noise level, status, trend).
- **`sensor_events`**: Append-only telemetry log for sensors, camera counts, or turnstile events.
- **`reservations`**: User-scoped reservations and 10-minute holds.
- **`alert_subscriptions`**: Student crowd threshold watchers (`threshold_percent`).
- **`notifications`**: User-scoped in-app notifications.

### Automatic Profile Creation Trigger:
When a student or admin signs up via Supabase Auth, the PostgreSQL trigger `handle_new_user()` automatically creates an associated record in `public.profiles` with the `student` role by default.

---

## 4. Seeding Initial Campus Spaces

Run the seed script located in `supabase/seed.sql` in the Supabase SQL Editor.

This seeds the 6 fictional CampusPulse spaces:
1. **Central Library** (Capacity: 100, Academic Block A, Ground Floor)
2. **Computer Lab 2** (Capacity: 40, Tech Block B, Level 1)
3. **Main Canteen** (Capacity: 120, Student Centre, Ground Floor)
4. **Study Room C** (Capacity: 30, Academic Block A, Level 2)
5. **Innovation Hub** (Capacity: 50, Tech Block B, Level 2)
6. **Seminar Hall A** (Capacity: 150, Academic Block C, Ground Floor)

Along with initial live occupancy records.

---

## 5. Setting Up Supabase Auth & Redirect URLs

1. In Supabase Dashboard, go to **Authentication -> URL Configuration**.
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/profile`
   - `https://your-domain.com/auth/callback`
4. Under **Authentication -> Email Templates**:
   - Ensure the confirmation URL contains `{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}`.

---

## 6. How to Assign Admin Role Safely During Development

By default, every newly registered user receives the `student` role. For security, role escalation controls are **never** exposed in the client UI.

To assign the `admin` role to a user for testing:

### Step 1: Sign up a user
Sign up through the `/signup` page with an email such as `admin@campus.edu`.

### Step 2: Elevate via Supabase SQL Editor
Run the following secure SQL query in your Supabase SQL Editor:

```sql
-- Find user ID by email and update role to 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@campus.edu'
);

-- Verify the update
SELECT id, full_name, role 
FROM public.profiles 
WHERE role = 'admin';
```

Once updated, the user will immediately have access to the `/admin` Command Centre and `/api/occupancy/update` endpoint.

---

## 7. Realtime Setup

CampusPulse publishes live occupancy updates and user notifications via Supabase Realtime.

In `supabase/schema.sql`, the following tables are added to the publication:
- `public.live_occupancy`
- `public.reservations`
- `public.notifications`
- `public.alert_subscriptions`

### Verification:
In the Supabase Dashboard, go to **Database -> Publications** and verify that `supabase_realtime` has these tables selected.

---

## 8. Protected API Endpoints & Role Checks

| Method | Endpoint | Authorization | Ownership / Scope Check | Description |
|---|---|---|---|---|
| `GET` | `/api/spaces` | Public / Authenticated | All spaces | List campus spaces with live occupancy |
| `GET` | `/api/spaces/[id]` | Public / Authenticated | Single space | Get space details and live state |
| `GET` | `/api/spaces/[id]/history` | Authenticated | Aggregated telemetry | Get 24h occupancy history |
| `POST` | `/api/occupancy/update` | **Admin Only** | Server verified `profile.role = 'admin'` | Ingest sensor data or admin simulator update |
| `POST` | `/api/reservations` | **Authenticated User** | `user_id = auth.uid()` | Creates 10-minute seat hold with overbooking check |
| `GET` | `/api/reservations` | **Authenticated User** | `user_id = auth.uid()` | Returns authenticated user's reservations |
| `PATCH` | `/api/reservations/[id]/check-in` | **Authenticated User** | Must own reservation (`user_id = auth.uid()`) | Confirms check-in within 10-min window |
| `PATCH` | `/api/reservations/[id]/cancel` | **Authenticated User** | Must own reservation (`user_id = auth.uid()`) | Cancels reservation and releases seat hold |
| `POST` | `/api/alerts` | **Authenticated User** | `user_id = auth.uid()` | Subscribes student to crowd threshold alert |
| `GET` | `/api/alerts` | **Authenticated User** | `user_id = auth.uid()` | Returns student's active alert subscriptions |
| `GET` | `/api/notifications` | **Authenticated User** | `user_id = auth.uid()` | Returns student's private in-app notifications |
| `PATCH` | `/api/notifications/[id]/read` | **Authenticated User** | Must own notification (`user_id = auth.uid()`) | Marks single notification as read |
| `POST` | `/api/recommendation` | Public / Authenticated | Multi-variable input | Calculates best space match score and reasoning |

---

## 9. API Testing Examples

### 1. Create a 10-Minute Seat Hold
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_AUTH_COOKIE" \
  -d '{
    "spaceId": "a1111111-1111-1111-1111-111111111111",
    "seatLabel": "Desk-B12"
  }'
```

### 2. Confirm Check-In
```bash
curl -X PATCH http://localhost:3000/api/reservations/YOUR_RESERVATION_ID/check-in \
  -H "Cookie: sb-access-token=YOUR_AUTH_COOKIE"
```

### 3. Update Occupancy (Admin Only)
```bash
curl -X POST http://localhost:3000/api/occupancy/update \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_AUTH_COOKIE" \
  -d '{
    "spaceId": "a1111111-1111-1111-1111-111111111111",
    "occupied": 65,
    "queueCount": 0,
    "noiseLevel": "quiet"
  }'
```

### 4. Query Smart Recommendation
```bash
curl -X POST http://localhost:3000/api/recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "spaceTypes": ["study_space", "computer_lab"],
    "maxWalkMinutes": 10,
    "preferredNoise": "quiet",
    "requireAccessible": true,
    "facilities": ["High-speed Wi-Fi", "Power Outlets"]
  }'
```

---

## 10. Troubleshooting

- **401 Unauthorized**: Session cookie is missing or expired. Call `supabase.auth.signInWithPassword()` or re-authenticate.
- **403 Forbidden on Occupancy Update**: The signed-in user does not have `role = 'admin'` in `public.profiles`. Execute the SQL update in Section 6.
- **409 Conflict on Reservation**: The target space is at capacity. Active holds and confirmed bookings have filled all available seats.
- **Realtime Not Firing**: Check that the table is listed in the `supabase_realtime` publication and that RLS policies permit SELECT for the authenticated user.
- **Demo Mode**: If you haven't yet set up a Supabase project, CampusPulse functions in demo mode with full simulation data.
