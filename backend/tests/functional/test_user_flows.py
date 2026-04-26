import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.auth import TokenOut, MessageOut, UserOut

pytestmark = pytest.mark.functional


# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def create_fake_token(email: str = "budi@test.com", user_id: str = "user-123") -> TokenOut:
    return TokenOut(
        access_token=f"fake.token.for.{user_id}",
        refresh_token="fake.refresh",
        expires_at=9999999999,
        user=UserOut(id=user_id, email=email, created_at="2025-01-01T00:00:00+00:00", email_confirmed=True),
    )


# =============================================================================
# SKENARIO 1: Alur Onboarding User Baru
# =============================================================================

class TestUserOnboardingFlow:
    """
    Skenario:
    User baru Budi mendaftar dan login.
    
    Alur:
    1. Budi daftar dengan email dan password
    2. Budi login dan mendapat token
    """

    @pytest.fixture
    def app_with_mocks(self):
        """
        Membuat app dengan semua service ter-mock.
        Setiap test di class ini mendapat fresh app + fresh mocks.
        """
        app = create_app()
        
        # Import semua dependency factories yang akan kita override
        from app.api.auth import get_auth_service
        from app.core.dependencies import get_current_user

        # Buat mock services
        mock_auth_svc = MagicMock()
        mock_user = MagicMock()
        mock_user.id = "user-budi-123"
        mock_user.email = "budi@test.com"
        mock_user.created_at = "2025-01-01T00:00:00+00:00"

        # Override dependencies
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_svc
        app.dependency_overrides[get_current_user] = lambda: mock_user

        return app, mock_auth_svc, mock_user

    def test_skenario_onboarding_lengkap(self, app_with_mocks):
        """
        Test alur lengkap: daftar → login
        
        Ini adalah "happy path" dari fitur autentikasi.
        Jika test ini pass, berarti fitur dasar berfungsi sebagaimana mestinya.
        """
        app, mock_auth_svc, mock_user = app_with_mocks
        
        with TestClient(app) as client:
            # ── LANGKAH 1: Daftar ────────────────────────────────────────────
            mock_auth_svc.register.return_value = MessageOut(
                message="Registration successful. Please check your email to confirm."
            )
            
            resp_register = client.post("/api/auth/register", json={
                "email": "budi@test.com",
                "password": "Password123!",
            })
            
            assert resp_register.status_code == 201, "Langkah 1: Registrasi harus 201"
            assert "successful" in resp_register.json()["message"].lower()

            # ── LANGKAH 2: Login ──────────────────────────────────────────────
            token = create_fake_token(email="budi@test.com", user_id="user-budi-123")
            mock_auth_svc.login.return_value = token
            
            resp_login = client.post("/api/auth/login", json={
                "email": "budi@test.com",
                "password": "Password123!",
            })
            
            assert resp_login.status_code == 200, "Langkah 2: Login harus 200"
            access_token = resp_login.json()["access_token"]
            assert access_token is not None, "Langkah 2: Harus ada access_token"


# =============================================================================
# SKENARIO 2: Security Boundary — User Tidak Bisa Akses Data Orang Lain
# =============================================================================

class TestSecurityBoundaryFlow:
    """
    Skenario:
    Memastikan endpoint protected hanya bisa diakses dengan token valid.
    
    Ini adalah skenario yang PALING KRITIS untuk aplikasi SaaS.
    Autentikasi dan otorisasi adalah requirement wajib.
    """

    def test_user_tanpa_token_tidak_bisa_akses_endpoint_protected(self):
        """
        SKENARIO: Request ke endpoint protected tanpa token.
        EKSPEKTASI: Semua endpoint protected return 401.
        """
        app = create_app()
        
        with TestClient(app) as client:
            protected_endpoints = [
                ("POST", "/api/auth/logout"),
            ]

            for method, url in protected_endpoints:
                if method == "GET":
                    resp = client.get(url)
                elif method == "POST":
                    resp = client.post(url, json={})

                assert resp.status_code == 401, (
                    f"Endpoint {method} {url} harus return 401 tanpa token, "
                    f"tapi dapat {resp.status_code}"
                )

    def test_token_dengan_format_salah_ditolak(self):
        """
        SKENARIO: Token ada tapi formatnya salah (tidak dimulai dengan "Bearer ").
        EKSPEKTASI: 401 Unauthorized.
        """
        app = create_app()
        
        with TestClient(app) as client:
            # Format salah: tidak ada "Bearer " prefix
            resp = client.post(
                "/api/auth/logout",
                headers={"Authorization": "hanya-token-tanpa-bearer"},
            )
            assert resp.status_code == 401

    def test_token_palsu_ditolak(self):
        """
        SKENARIO: Token ada dan formatnya benar, tapi nilainya palsu.
        EKSPEKTASI: 401 Unauthorized.
        
        Ini adalah test nyata yang akan ke Supabase untuk verifikasi token.
        Di sini kita verifikasi bahwa rejection path bekerja.
        """
        app = create_app()
        
        with TestClient(app) as client:
            resp = client.post(
                "/api/auth/logout",
                headers={"Authorization": "Bearer ini.jelas.token.palsu"},
            )
            assert resp.status_code == 401


# =============================================================================
# SKENARIO 3: Error Recovery
# =============================================================================

class TestErrorRecoveryFlow:
    """
    Skenario:
    Memastikan aplikasi memberikan respons yang proper saat terjadi error.
    User harus mendapat feedback yang jelas, bukan error 500 yang membingungkan.
    """

    def test_request_dengan_json_tidak_valid_mendapat_pesan_jelas(self):
        """
        SKENARIO: Request dengan body bukan JSON valid.
        EKSPEKTASI: 422 dengan pesan yang menjelaskan masalahnya.
        """
        app = create_app()
        
        with TestClient(app) as client:
            # Kirim string, bukan JSON object
            resp = client.post(
                "/api/auth/login",
                content="ini bukan json",
                headers={"Content-Type": "application/json"},
            )
            
            assert resp.status_code == 422
            assert "detail" in resp.json()

    def test_server_error_tidak_bocorkan_detail_internal(self):
        """
        SKENARIO: Ada error internal di server (tidak terduga).
        EKSPEKTASI: User mendapat pesan generik, BUKAN stack trace.
        
        SECURITY: Stack trace bisa mengungkapkan informasi sensitif
        tentang arsitektur internal sistem kita.
        """
        app = create_app()
        from app.api.auth import get_auth_service

        # Force error 500
        mock_service = MagicMock()
        mock_service.login.side_effect = RuntimeError("Internal database error: password_hash table is null")
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            with TestClient(app, raise_server_exceptions=False) as client:
                resp = client.post("/api/auth/login", json={
                    "email": "test@test.com",
                    "password": "Password123",
                })

                # User harus dapat error, tapi bukan detail internal
                assert resp.status_code >= 400

                response_text = resp.text.lower()
                # Detail error internal tidak boleh bocor ke user
                assert "password_hash" not in response_text
                assert "traceback" not in response_text

        finally:
            app.dependency_overrides.clear()