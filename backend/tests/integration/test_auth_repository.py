import pytest
import os
from unittest.mock import patch, MagicMock

from app.repositories.auth_repository import AuthRepository
from app.core.exceptions import (
    AuthenticationError,
    UserAlreadyExistsError,
    InvalidTokenError,
)

# Mark semua test di file ini sebagai integration test
pytestmark = pytest.mark.integration


# ─────────────────────────────────────────────────────────────────────────────
# Fixture untuk Integration Test
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def supabase_test_client():
    """
    Client Supabase untuk testing.
    
    Menggunakan Supabase project terpisah untuk test yang sudah dikonfigurasi di .env
    """
    run_integration = os.getenv("RUN_INTEGRATION_TESTS")
    test_url = os.getenv("SUPABASE_TEST_URL")
    test_key = os.getenv("SUPABASE_TEST_ANON_KEY")

    if not run_integration:
        pytest.skip(
            "RUN_INTEGRATION_TESTS tidak di-set. "
            "Set RUN_INTEGRATION_TESTS=1 untuk menjalankan integration tests Supabase."
        )

    if test_url and test_key:
        # Koneksi ke Supabase test environment yang nyata
        from supabase import create_client
        return create_client(test_url, test_key)
    else:
        # Skip test jika environment variables tidak tersedia
        pytest.skip(
            "SUPABASE_TEST_URL dan SUPABASE_TEST_ANON_KEY tidak di-set. "
            "Setup Supabase test environment untuk menjalankan integration tests."
        )


@pytest.fixture
def auth_repo(supabase_test_client):
    """AuthRepository dengan koneksi Supabase test."""
    return AuthRepository(client=supabase_test_client)


# ─────────────────────────────────────────────────────────────────────────────
# Demonstrasi Pola Integration Test dengan Controlled Mock
# (Berguna untuk belajar ketika belum ada Supabase test environment)
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthRepositoryWithControlledMock:
    """
    Pola "Integration Test dengan Mock yang Terkontrol".
    
    Ini BUKAN full integration test, tapi berguna untuk:
    1. Belajar pola integration test
    2. Test error translation (AuthApiError → domain exception kita)
    3. Test saat Supabase test environment belum tersedia
    
    Yang membedakan dari unit test:
    - Kita mock di level Supabase CLIENT, bukan di level REPOSITORY
    - Repository code berjalan sebagaimana mestinya
    - Hanya network call ke Supabase yang di-mock
    """

    def test_repository_mentranslasi_supabase_error_ke_domain_exception(self):
        """
        SKENARIO: Supabase mengembalikan AuthApiError saat login gagal.
        EKSPEKTASI: Repository mengkonversinya ke AuthenticationError kita.
        
        INI ADALAH INTI DARI REPOSITORY PATTERN:
        Layer di atasnya (service) tidak boleh tahu tentang AuthApiError.
        Repository "menerjemahkan" bahasa Supabase ke bahasa domain kita.
        """
        from supabase import AuthApiError

        # Buat mock client
        mock_client = MagicMock()

        # Konfigurasi: auth.sign_in_with_password() melempar AuthApiError
        mock_client.auth.sign_in_with_password.side_effect = AuthApiError(
            message="Invalid login credentials",
            code=400,
            status=400,
        )

        repo = AuthRepository(client=mock_client)

        # ASSERT: AuthApiError dari Supabase harus dikonversi ke AuthenticationError kita
        with pytest.raises(AuthenticationError) as exc_info:
            repo.login(email="salah@test.com", password="salahpassword")

        # Pesan harus generik (tidak bocorkan apakah email ada atau tidak)
        assert "invalid" in exc_info.value.message.lower()

    def test_repository_mengenali_email_sudah_terdaftar(self):
        """
        SKENARIO: Supabase mengembalikan error "already registered".
        EKSPEKTASI: Repository mengkonversinya ke UserAlreadyExistsError.
        """
        from supabase import AuthApiError

        mock_client = MagicMock()
        mock_client.auth.sign_up.side_effect = AuthApiError(
            message="User already registered",
            code=422,
            status=422,
        )

        repo = AuthRepository(client=mock_client)

        with pytest.raises(UserAlreadyExistsError) as exc_info:
            repo.register(
                email="sudah@ada.com",
                password="Password123",
                redirect_url="http://localhost:3000"
            )

        assert "already exists" in exc_info.value.message.lower()

    def test_logout_tidak_melempar_exception_meski_supabase_error(self):
        """
        SKENARIO: Supabase error saat logout (session sudah invalid).
        EKSPEKTASI: Repository TIDAK melempar exception — logout selalu "berhasil".
        
        UX consideration: user tidak boleh stuck dalam keadaan "gagal logout".
        """
        from supabase import AuthApiError

        mock_client = MagicMock()
        mock_client.auth.admin.sign_out.side_effect = AuthApiError(
            message="Session not found",
            code=400,
            status=400,
        )

        repo = AuthRepository(client=mock_client)

        # Ini TIDAK boleh raise exception
        try:
            repo.logout("expired.jwt.token")  # Harus silent fail
        except Exception as e:
            pytest.fail(f"logout() tidak seharusnya raise exception: {e}")

    def test_refresh_token_tidak_valid_melempar_invalid_token_error(self):
        """
        SKENARIO: Refresh token sudah expired atau sudah dipakai.
        EKSPEKTASI: InvalidTokenError dengan pesan yang jelas.
        """
        from supabase import AuthApiError

        mock_client = MagicMock()
        mock_client.auth.refresh_session.side_effect = AuthApiError(
            message="Token has expired or is invalid",
            code=400,
            status=400,
        )

        repo = AuthRepository(client=mock_client)

        with pytest.raises(InvalidTokenError):
            repo.refresh_session("invalid_or_expired_refresh_token")


# ─────────────────────────────────────────────────────────────────────────────
# Full Integration Tests (Membutuhkan Supabase Test Environment)
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthRepositoryFullIntegration:
    """
    Test dengan koneksi Supabase yang nyata.
    Dijalankan hanya jika SUPABASE_TEST_URL tersedia.
    
    Pola yang baik untuk full integration test:
    1. Setup: buat data test
    2. Test: jalankan operasi yang diuji
    3. Teardown: bersihkan data test
    
    Gunakan fixture dengan yield untuk pastikan teardown selalu berjalan.
    """

    @pytest.fixture(autouse=True)
    def setup_teardown(self, auth_repo):
        """
        autouse=True: fixture ini otomatis dijalankan untuk semua test di class ini.
        
        Pola yield di fixture:
        - Kode sebelum yield = setup (dijalankan sebelum test)
        - yield = test dijalankan di sini
        - Kode setelah yield = teardown (dijalankan setelah test, bahkan jika test gagal)
        """
        self.test_emails = []  # Track email yang dibuat untuk cleanup

        yield  # Test dijalankan di sini

        # TEARDOWN: Hapus semua user test yang dibuat
        # (Di Supabase, ini butuh admin client)
        # Untuk sekarang, ini hanya placeholder
        pass

    def test_register_user_baru(self, auth_repo):
        """
        Test register dengan Supabase nyata.
        
        CATATAN: Supabase biasanya mengirim email konfirmasi.
        Di test environment, disable email confirmation di Dashboard:
        Authentication → Email → Confirm email → OFF
        """
        import uuid
        # Gunakan domain email yang lebih realistis
        unique_email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"
        self.test_emails.append(unique_email)

        response = auth_repo.register(
            email=unique_email,
            password="Password123",
            redirect_url="http://localhost:3000",
        )

        assert response.user is not None
        assert response.user.email == unique_email

    def test_login_setelah_register(self, auth_repo):
        """
        Test alur register → login.
        
        Ini adalah integration test yang menguji DUA operasi sekaligus.
        Memastikan data yang disimpan saat register bisa digunakan untuk login.
        """
        import uuid
        # Gunakan domain email yang lebih realistis
        unique_email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"
        self.test_emails.append(unique_email)

        # Register dulu
        auth_repo.register(
            email=unique_email,
            password="Password123",
            redirect_url="http://localhost:3000",
        )

        # Login dengan credentials yang sama
        response = auth_repo.login(
            email=unique_email,
            password="Password123",
        )

        assert response.session is not None
        assert response.session.access_token is not None
        assert response.user.email == unique_email