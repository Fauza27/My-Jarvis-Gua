-- R018, R054, R056. Existing transactions and profiles are not overwritten.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conrelid = 'public.expenses'::regclass
                     AND conname = 'expenses_amount_positive_finite') THEN
        ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_positive_finite
            CHECK (amount > 0 AND amount::text NOT IN ('NaN', 'Infinity', '-Infinity')) NOT VALID;
    END IF;
END;
$$;
ALTER TABLE public.expenses VALIDATE CONSTRAINT expenses_amount_positive_finite;

INSERT INTO public.profiles (id, display_name, avatar_url, auth_provider)
SELECT u.id,
       COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'display_name'), ''),
                NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
                NULLIF(btrim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)),
       COALESCE(NULLIF(u.raw_user_meta_data->>'avatar_url', ''),
                NULLIF(u.raw_user_meta_data->>'picture', '')),
       COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- RLS does not protect TRUNCATE. Retain existing row-level CRUD privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.expenses, public.profiles FROM authenticated, anon;
REVOKE ALL ON public.expenses, public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.active_expenses FROM authenticated, service_role;

CREATE OR REPLACE FUNCTION public.soft_delete_expense(expense_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
    UPDATE public.expenses SET deleted_at = now()
    WHERE id = expense_id AND user_id = auth.uid() AND deleted_at IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.soft_delete_expense(uuid) FROM PUBLIC, anon;
COMMIT;

SELECT (SELECT count(*) FROM auth.users u WHERE NOT EXISTS
        (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) AS missing_profiles,
       (SELECT convalidated FROM pg_constraint WHERE conrelid='public.expenses'::regclass
        AND conname='expenses_amount_positive_finite') AS amount_constraint_validated,
       has_table_privilege('authenticated','public.expenses','TRUNCATE') AS authenticated_truncate,
       has_table_privilege('anon','public.profiles','SELECT') AS anon_profile_select,
       (SELECT prosecdef FROM pg_proc WHERE oid='public.soft_delete_expense(uuid)'::regprocedure)
         AS soft_delete_security_definer;
