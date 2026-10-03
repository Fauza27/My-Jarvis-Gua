BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS embedding_pending boolean NOT NULL DEFAULT false;
ALTER TABLE public.expenses ALTER COLUMN embedding_pending SET DEFAULT true;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS embedding_model text;

CREATE OR REPLACE FUNCTION public.invalidate_expense_embedding()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    IF ROW(NEW.amount, NEW.type, NEW.description, NEW.category, NEW.subcategory, NEW.payment_method)
       IS DISTINCT FROM
       ROW(OLD.amount, OLD.type, OLD.description, OLD.category, OLD.subcategory, OLD.payment_method) THEN
        NEW.embedding = NULL;
        NEW.embedding_pending = true;
        NEW.embedding_model = NULL;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS invalidate_expense_embedding ON public.expenses;
CREATE TRIGGER invalidate_expense_embedding
    BEFORE UPDATE OF amount, type, description, category, subcategory, payment_method
    ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.invalidate_expense_embedding();
COMMIT;
