-- ============================================================================
-- CAMPUSPULSE SEED DATA
-- Fictional smart-campus facilities and live occupancy telemetry
-- ============================================================================

-- Clean existing seed data
TRUNCATE public.spaces, public.live_occupancy CASCADE;

-- Insert the 6 Fictional CampusPulse Spaces with known deterministic UUIDs
INSERT INTO public.spaces (
    id, slug, name, type, building, floor, capacity,
    map_x, map_y, latitude, longitude,
    has_wifi, has_power, has_computers, is_quiet_zone, is_accessible, service_rate_per_minute
) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'central-library',
    'Central Library',
    'study_space',
    'Academic Block A',
    'Ground',
    100,
    35.0, 28.0, 28.6139, 77.2090,
    true, true, false, true, true, 0
),
(
    'a2222222-2222-2222-2222-222222222222',
    'computer-lab-2',
    'Computer Lab 2',
    'computer_lab',
    'Tech Block B',
    'Level 1',
    40,
    58.0, 42.0, 28.6145, 77.2102,
    true, true, true, false, true, 0
),
(
    'a3333333-3333-3333-3333-333333333333',
    'main-canteen',
    'Main Canteen',
    'canteen',
    'Student Centre',
    'Ground',
    120,
    22.0, 55.0, 28.6130, 77.2085,
    true, false, false, false, true, 3.0
),
(
    'a4444444-4444-4444-4444-444444444444',
    'study-room-c',
    'Study Room C',
    'study_space',
    'Academic Block A',
    'Level 2',
    30,
    40.0, 22.0, 28.6141, 77.2094,
    true, true, false, true, true, 0
),
(
    'a5555555-5555-5555-5555-555555555555',
    'innovation-hub',
    'Innovation Hub',
    'collaboration',
    'Tech Block B',
    'Level 2',
    50,
    65.0, 35.0, 28.6148, 77.2108,
    true, true, true, false, true, 0
),
(
    'a6666666-6666-6666-6666-666666666666',
    'seminar-hall-a',
    'Seminar Hall A',
    'event_space',
    'Academic Block C',
    'Ground',
    150,
    48.0, 70.0, 28.6125, 77.2095,
    true, true, false, true, true, 0
);

-- Seed Initial Live Occupancy State
INSERT INTO public.live_occupancy (
    space_id, occupied, available, queue_count, noise_level, status, trend, updated_at
) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    62, 38, 0, 'quiet', 'moderate', 'rising', timezone('utc'::text, now())
),
(
    'a2222222-2222-2222-2222-222222222222',
    29, 11, 0, 'moderate', 'moderate', 'steady', timezone('utc'::text, now())
),
(
    'a3333333-3333-3333-3333-333333333333',
    86, 34, 18, 'loud', 'crowded', 'rising', timezone('utc'::text, now())
),
(
    'a4444444-4444-4444-4444-444444444444',
    12, 18, 0, 'silent', 'moderate', 'steady', timezone('utc'::text, now())
),
(
    'a5555555-5555-5555-5555-555555555555',
    33, 17, 0, 'moderate', 'moderate', 'easing', timezone('utc'::text, now())
),
(
    'a6666666-6666-6666-6666-666666666666',
    18, 132, 0, 'quiet', 'quiet', 'steady', timezone('utc'::text, now())
);

-- Insert Sample Initial Sensor Events (Last 1 Hour)
INSERT INTO public.sensor_events (space_id, source, event_type, occupancy_count, recorded_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'gateway_thermal_array', 'entry', 58, timezone('utc'::text, now() - interval '45 minutes')),
('a1111111-1111-1111-1111-111111111111', 'gateway_thermal_array', 'entry', 62, timezone('utc'::text, now() - interval '5 minutes')),
('a4444444-4444-4444-4444-444444444444', 'acoustic_sensor_carrel', 'entry', 12, timezone('utc'::text, now() - interval '10 minutes')),
('a3333333-3333-3333-3333-333333333333', 'turnstile_optical_beam', 'entry', 86, timezone('utc'::text, now() - interval '2 minutes'));
