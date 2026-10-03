BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE OR REPLACE FUNCTION public.match_expense_filtered(
    query_embedding public.vector(1536), user_id_param uuid,
    match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 5,
    date_from date DEFAULT NULL, date_to date DEFAULT NULL
)
RETURNS TABLE (
    id uuid, user_id uuid, amount numeric, type varchar, description text,
    category varchar, subcategory varchar, payment_method varchar,
    transaction_date date, created_at timestamptz, updated_at timestamptz,
    similarity double precision
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
    SELECT t.id, t.user_id, t.amount, t.type, t.description, t.category,
           t.subcategory, t.payment_method, t.transaction_date,
           t.created_at, t.updated_at,
           1 - (t.embedding OPERATOR(public.<=>) query_embedding)
    FROM public.expenses AS t
    WHERE t.user_id = user_id_param
      AND t.deleted_at IS NULL AND t.embedding IS NOT NULL
      AND (date_from IS NULL OR t.transaction_date >= date_from)
      AND (date_to IS NULL OR t.transaction_date <= date_to)
      AND 1 - (t.embedding OPERATOR(public.<=>) query_embedding) > match_threshold
    ORDER BY t.embedding OPERATOR(public.<=>) query_embedding, t.id
    LIMIT LEAST(GREATEST(match_count, 1), 50);
$$;
REVOKE ALL ON FUNCTION public.match_expense_filtered(public.vector, uuid, double precision, integer, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_expense_filtered(public.vector, uuid, double precision, integer, date, date) TO authenticated, service_role;
COMMIT;
