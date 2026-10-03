-- Prevent anonymous/cross-user restoration; use caller RLS instead of owner bypass.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
CREATE OR REPLACE FUNCTION public.restore_expense(expense_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  UPDATE public.expenses
  SET deleted_at = NULL
  WHERE id = expense_id
    AND (user_id = auth.uid() OR auth.role() = 'service_role')
    AND deleted_at IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.restore_expense(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_expense(uuid) TO authenticated, service_role;
COMMIT;
