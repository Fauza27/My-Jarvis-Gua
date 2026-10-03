BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';
COMMIT;
