-- Patch: Restrict profiles read access and invalidate existing connect codes.
BEGIN;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

CREATE POLICY "Profiles are readable by owner"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

UPDATE public.profiles
SET connect_code = NULL,
    connect_code_expires_at = NULL
WHERE connect_code IS NOT NULL;

COMMIT;
