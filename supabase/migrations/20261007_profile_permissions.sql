-- Apply once to an existing CampusPulse database before enabling real accounts.
-- Fresh installs already include this restriction in schema.sql.
-- Profile ownership RLS alone must not allow a student to change their own role.
BEGIN;
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url, preferred_noise_level, max_walk_minutes,
    accessibility_required, updated_at) ON public.profiles TO authenticated;
COMMIT;
