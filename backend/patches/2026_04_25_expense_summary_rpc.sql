-- Patch: Add RPC helpers for efficient expense summaries.
BEGIN;

CREATE OR REPLACE FUNCTION public.expense_summary_all_time(user_id_param uuid)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  net_balance numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(sum(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
    COALESCE(sum(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense,
    COALESCE(sum(amount) FILTER (WHERE type = 'income'), 0)
      - COALESCE(sum(amount) FILTER (WHERE type = 'expense'), 0) AS net_balance
  FROM public.expenses
  WHERE user_id = user_id_param
    AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.expense_summary_by_month(
  user_id_param uuid,
  month_param int,
  year_param int
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  net_balance numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(sum(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
    COALESCE(sum(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense,
    COALESCE(sum(amount) FILTER (WHERE type = 'income'), 0)
      - COALESCE(sum(amount) FILTER (WHERE type = 'expense'), 0) AS net_balance
  FROM public.expenses
  WHERE user_id = user_id_param
    AND deleted_at IS NULL
    AND transaction_date >= make_date(year_param, month_param, 1)
    AND transaction_date < (make_date(year_param, month_param, 1) + interval '1 month');
$$;

CREATE OR REPLACE FUNCTION public.expense_summary_by_year(
  user_id_param uuid,
  year_param int
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  net_balance numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(sum(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
    COALESCE(sum(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense,
    COALESCE(sum(amount) FILTER (WHERE type = 'income'), 0)
      - COALESCE(sum(amount) FILTER (WHERE type = 'expense'), 0) AS net_balance
  FROM public.expenses
  WHERE user_id = user_id_param
    AND deleted_at IS NULL
    AND transaction_date >= make_date(year_param, 1, 1)
    AND transaction_date < make_date(year_param + 1, 1, 1);
$$;

COMMIT;
