-- Close cross-user Data API access while preserving view shape and owner policies.
-- Applied only after catalog inspection confirms PostgreSQL >=15 and expenses RLS.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
DO $$
BEGIN
  IF current_setting('server_version_num')::integer < 150000 THEN
    RAISE EXCEPTION 'PostgreSQL >=15 required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='expenses' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Underlying expenses RLS must be enabled';
  END IF;
END
$$;
ALTER VIEW public.active_expenses SET (security_invoker = true);
REVOKE ALL PRIVILEGES ON public.active_expenses FROM anon;
REVOKE ALL PRIVILEGES ON public.active_expenses FROM PUBLIC;
COMMIT;
