-- ============================================================================
-- CAMPUSPULSE DATABASE SCHEMA
-- Production PostgreSQL Architecture for Supabase
-- Privacy-first smart campus resource finder & crowd predictor
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES DEFINITIONS
-- ============================================================================

-- PROFILES: Extends Supabase auth.users with student/admin roles and preferences
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    avatar_url TEXT,
    preferred_noise_level TEXT CHECK (preferred_noise_level IN ('silent', 'quiet', 'moderate', 'no_preference')),
    max_walk_minutes INTEGER CHECK (max_walk_minutes > 0),
    accessibility_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SPACES: Master catalog of physical campus facilities
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    map_x NUMERIC(5,2) NOT NULL,
    map_y NUMERIC(5,2) NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    has_wifi BOOLEAN NOT NULL DEFAULT true,
    has_power BOOLEAN NOT NULL DEFAULT true,
    has_computers BOOLEAN NOT NULL DEFAULT false,
    is_quiet_zone BOOLEAN NOT NULL DEFAULT false,
    is_accessible BOOLEAN NOT NULL DEFAULT true,
    service_rate_per_minute NUMERIC(4,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- LIVE_OCCUPANCY: Real-time sensor state aggregated per facility
CREATE TABLE IF NOT EXISTS public.live_occupancy (
    space_id UUID PRIMARY KEY REFERENCES public.spaces(id) ON DELETE CASCADE,
    occupied INTEGER NOT NULL CHECK (occupied >= 0),
    available INTEGER NOT NULL CHECK (available >= 0),
    queue_count INTEGER NOT NULL DEFAULT 0 CHECK (queue_count >= 0),
    noise_level TEXT NOT NULL DEFAULT 'moderate',
    status TEXT NOT NULL CHECK (status IN ('quiet', 'moderate', 'crowded', 'closed')),
    trend TEXT NOT NULL DEFAULT 'steady' CHECK (trend IN ('rising', 'steady', 'easing')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SENSOR_EVENTS: Append-only raw telemetry log for audit and prediction training
CREATE TABLE IF NOT EXISTS public.sensor_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    occupancy_count INTEGER NOT NULL CHECK (occupancy_count >= 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sensor_events_space_time ON public.sensor_events(space_id, recorded_at DESC);

-- RESERVATIONS: User-scoped 10-minute holds and confirmed desk bookings
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    seat_label TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('holding', 'confirmed', 'completed', 'cancelled', 'expired')) DEFAULT 'holding',
    expires_at TIMESTAMPTZ NOT NULL,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_space_status ON public.reservations(space_id, status);

-- ALERT_SUBSCRIPTIONS: Student threshold watchers for crowd easing
CREATE TABLE IF NOT EXISTS public.alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    threshold_percent INTEGER NOT NULL DEFAULT 70 CHECK (threshold_percent BETWEEN 1 AND 100),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, space_id)
);

-- NOTIFICATIONS: User-scoped in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ============================================================================
-- 3. AUTOMATIC PROFILE CREATION TRIGGER (AUTH HOOK)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4.1. PROFILES POLICIES
-- Anyone authenticated can view user profiles (needed for names on collaboration spaces)
CREATE POLICY "Public profiles can be viewed by authenticated users"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can only modify their own preferences
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Row ownership alone does not prevent a user from promoting their own role.
-- Grant only the editable profile fields; roles remain an admin SQL operation.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url, preferred_noise_level, max_walk_minutes,
              accessibility_required, updated_at) ON public.profiles TO authenticated;

-- 4.2. SPACES & LIVE_OCCUPANCY POLICIES
-- Public read access so students can query spaces before walking
CREATE POLICY "Spaces are readable by everyone"
    ON public.spaces FOR SELECT
    USING (true);

CREATE POLICY "Live occupancy is readable by everyone"
    ON public.live_occupancy FOR SELECT
    USING (true);

-- Occupancy writes are strictly restricted to administrators or verified server services
CREATE POLICY "Only admins can insert or update live occupancy"
    ON public.live_occupancy FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4.3. SENSOR_EVENTS POLICIES
-- Privacy by design: Sensor logs are restricted to admins; students only see aggregate live_occupancy
CREATE POLICY "Admins can view sensor events"
    ON public.sensor_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins or server service can insert sensor events"
    ON public.sensor_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4.4. RESERVATIONS POLICIES
-- Student can only query their own reservation
CREATE POLICY "Students can view their own reservations"
    ON public.reservations FOR SELECT
    USING (auth.uid() = user_id);

-- Students can insert reservations where user_id matches authenticated session
CREATE POLICY "Students can insert their own reservations"
    ON public.reservations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Students can only update (check in / cancel) their own reservations
CREATE POLICY "Students can update their own reservations"
    ON public.reservations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Campus admins can view aggregate reservation metrics
CREATE POLICY "Admins can view all reservations"
    ON public.reservations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4.5. ALERT_SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view their own alerts"
    ON public.alert_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
    ON public.alert_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify or delete their own alerts"
    ON public.alert_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
    ON public.alert_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- 4.6. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. REALTIME PUBLICATION
-- ============================================================================

-- Add appropriate real-time tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_occupancy;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_subscriptions;
