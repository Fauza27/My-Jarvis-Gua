-- =============================================
-- TABLE: expenses
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
    id               UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id          UUID           REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount           NUMERIC(15, 2) NOT NULL,
    type             VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
    description      TEXT,
    category         VARCHAR(50)    NOT NULL,
    subcategory      VARCHAR(50),
    payment_method   VARCHAR(50),
    transaction_date DATE           DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ    DEFAULT NOW() NOT NULL,
    updated_at       TIMESTAMPTZ    DEFAULT NOW() NOT NULL,
    deleted_at       TIMESTAMPTZ    DEFAULT NULL
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
    ON expenses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
    ON expenses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
    ON expenses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
    ON expenses
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- VIEW: active_expenses (soft delete filter)
-- Gunakan view ini untuk query di aplikasi.
-- Tabel asli tetap bisa diakses untuk keperluan
-- admin/audit/restore.
-- =============================================
CREATE OR REPLACE VIEW active_expenses AS
    SELECT * FROM expenses
    WHERE deleted_at IS NULL;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_expenses_user_id          ON expenses(user_id);
CREATE INDEX idx_expenses_transaction_date ON expenses(transaction_date);
CREATE INDEX idx_expenses_deleted_at       ON expenses(deleted_at);

-- =============================================
-- TRIGGER: auto update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: soft delete helper
-- Daripada DELETE, panggil function ini.
-- Contoh: SELECT soft_delete_expense('uuid-nya');
-- =============================================
CREATE OR REPLACE FUNCTION soft_delete_expense(expense_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE expenses
    SET deleted_at = NOW()
    WHERE id = expense_id
      AND auth.uid() = user_id
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: restore soft deleted expense (admin)
-- Contoh: SELECT restore_expense('uuid-nya');
-- =============================================
CREATE OR REPLACE FUNCTION restore_expense(expense_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE expenses
    SET deleted_at = NULL
    WHERE id = expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================
-- ========================================================================
-- ======================================================================

-- =============================================================================
-- schema.sql — Profiles + Telegram Integration
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 1: TABEL PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
-- Tabel ini menyimpan data publik user.
-- Terpisah dari auth.users agar bisa dikustom dan diakses via API.

CREATE TABLE IF NOT EXISTS public.profiles (
    -- id harus sama dengan id di auth.users (foreign key)
    id              UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name    TEXT,       -- Nama tampilan user
    bio             TEXT,       -- Bio / deskripsi singkat
    avatar_url      TEXT,       -- URL foto profil
    -- telegram_chat_id untuk integrasi bot:
    -- BIGINT karena Telegram chat_id adalah integer besar
    -- UNIQUE agar satu akun Telegram hanya bisa link ke satu akun Taskly
    telegram_chat_id BIGINT     UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa BACA semua profil (publik)
-- Ini perlu agar bot bisa mencari profil berdasarkan telegram_chat_id
CREATE POLICY "Profiles are publicly readable"
    ON public.profiles FOR SELECT
    USING (true);

-- Policy: Hanya pemilik yang bisa UPDATE profilnya sendiri
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policy: INSERT dilakukan oleh trigger (service role), bukan user langsung
-- Dengan ini, user tidak bisa buat profil untuk orang lain
CREATE POLICY "Profiles are created by trigger only"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 2: TRIGGER — AUTO-CREATE PROFIL SAAT USER DAFTAR
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Setiap kali ada INSERT baru di auth.users (user baru daftar),
-- trigger ini otomatis membuat row di public.profiles.
--
-- SECURITY DEFINER sangat penting:
-- Trigger berjalan dengan role 'supabase_auth_admin' yang tidak punya
-- izin ke schema public. SECURITY DEFINER membuatnya berjalan dengan
-- izin creator (postgres), yang punya akses ke public.profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                -- Jalankan dengan izin creator (postgres role)
SET search_path = public        -- Pastikan search schema sudah benar
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        -- NEW adalah row baru di auth.users
        -- raw_user_meta_data adalah jsonb dari metadata yang dikirim saat sign_up
        -- Operator ->> mengambil nilai sebagai TEXT
        COALESCE(
            NEW.raw_user_meta_data ->> 'display_name',  -- Coba ambil dari metadata
            split_part(NEW.email, '@', 1)               -- Fallback: username dari email
        )
    );
    RETURN NEW;  -- WAJIB untuk AFTER trigger, tapi konvensi untuk tetap return
END;
$$;

-- Pasang trigger ke tabel auth.users
-- AFTER INSERT = jalankan setelah row berhasil di-insert (bukan sebelum)
-- FOR EACH ROW = jalankan untuk setiap row yang di-insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 3: AUTO-UPDATE updated_at PADA PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 5: GRANT UNTUK SERVICE ROLE
-- ─────────────────────────────────────────────────────────────────────────────
-- Ini memastikan service_role bisa membaca profil berdasarkan telegram_chat_id
-- (untuk lookup saat bot menerima pesan)

GRANT SELECT ON public.profiles TO service_role;
GRANT UPDATE ON public.profiles TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFIKASI
-- ─────────────────────────────────────────────────────────────────────────────
-- Setelah run, cek dengan query ini:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';

-- ─────────────────────────────────────────────────────────────────────────────
-- TAMBAH KOLOM BARU KE PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

-- auth_provider: cara user daftar pertama kali
-- Nilai: 'email', 'google', 'github', dll
-- Diambil dari raw_app_meta_data ->> 'provider'
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- connect_code: kode one-time untuk hubungkan Telegram bot
-- Contoh nilai: 'TASKLY-AB12CD'
-- NULL artinya tidak ada kode aktif
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS connect_code TEXT UNIQUE;

-- connect_code_expires_at: kapan kode kedaluwarsa
-- Bot harus tolak kode yang sudah lewat waktu ini
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS connect_code_expires_at TIMESTAMPTZ;


-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE TRIGGER — HANDLE SEMUA FORMAT METADATA
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SEBELUM (hanya baca 'display_name' — tidak cocok untuk OAuth):
--   NEW.raw_user_meta_data ->> 'display_name'
--
-- SESUDAH (COALESCE dari berbagai key yang mungkin ada):
--   1. 'display_name' → dari email/password sign up kita
--   2. 'full_name'    → dari Google dan GitHub OAuth
--   3. 'name'         → fallback OAuth umum
--   4. split_part(email, '@', 1) → last resort
--
-- Untuk avatar_url:
--   1. 'avatar_url'   → dari GitHub OAuth
--   2. 'picture'      → dari Google OAuth
--
-- Kenapa perlu ON CONFLICT DO NOTHING?
--   Supabase bisa trigger INSERT ke auth.users lebih dari sekali
--   dalam skenario tertentu (misalnya account linking).
--   Tanpa ON CONFLICT, akan ERROR duplicate primary key.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_display_name  TEXT;
    v_avatar_url    TEXT;
    v_auth_provider TEXT;
BEGIN
    -- ── Tentukan display_name ──────────────────────────────────────────────
    -- COALESCE mengembalikan nilai pertama yang tidak NULL
    v_display_name := COALESCE(
        -- Email/password: kita kirim display_name custom
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
        -- Google & GitHub OAuth: pakai full_name
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        -- OAuth fallback umum
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
        -- Last resort: ambil bagian sebelum @ dari email
        split_part(NEW.email, '@', 1)
    );

    -- ── Tentukan avatar_url ────────────────────────────────────────────────
    v_avatar_url := COALESCE(
        -- GitHub OAuth
        NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', ''),
        -- Google OAuth
        NULLIF(NEW.raw_user_meta_data ->> 'picture', '')
        -- Email/password: tidak ada avatar default (NULL)
    );

    -- ── Tentukan auth_provider ─────────────────────────────────────────────
    -- raw_app_meta_data diisi Supabase otomatis, berisi info provider
    -- Contoh: {"provider": "google", "providers": ["google"]}
    v_auth_provider := COALESCE(
        NEW.raw_app_meta_data ->> 'provider',
        'email'  -- default jika tidak ada info provider
    );

    -- ── Insert profil baru ─────────────────────────────────────────────────
    INSERT INTO public.profiles (id, display_name, avatar_url, auth_provider)
    VALUES (NEW.id, v_display_name, v_avatar_url, v_auth_provider)
    -- ON CONFLICT: jika profil sudah ada (misalnya dari account linking),
    -- jangan error — update saja nama dan avatar jika NULL
    ON CONFLICT (id) DO UPDATE
        SET
            -- Hanya update display_name jika masih NULL (jangan timpa nama yang user sudah set)
            display_name = CASE
                WHEN profiles.display_name IS NULL THEN EXCLUDED.display_name
                ELSE profiles.display_name
            END,
            -- Sama untuk avatar
            avatar_url = CASE
                WHEN profiles.avatar_url IS NULL THEN EXCLUDED.avatar_url
                ELSE profiles.avatar_url
            END;

    RETURN NEW;
END;
$$;

-- Trigger-nya tidak perlu diubah — fungsinya sudah di-replace di atas
-- CREATE OR REPLACE otomatis mengganti yang lama


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX untuk connect_code
-- ─────────────────────────────────────────────────────────────────────────────
-- Bot akan sering query berdasarkan connect_code saat user /connect
-- Index ini membuat query tersebut cepat

CREATE INDEX IF NOT EXISTS idx_profiles_connect_code
    ON public.profiles (connect_code)
    WHERE connect_code IS NOT NULL;  -- Partial index: hanya index row yang punya kode
