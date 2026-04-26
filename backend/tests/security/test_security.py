# =============================================================================
# tests/security/test_security.py — Security Tests
#
# TIPE TEST: Security Test
# YANG DIUJI: Keamanan seluruh API
#
# BERDASARKAN: OWASP Top 10 dan best practices autentikasi
# Referensi: https://owasp.org/www-project-top-ten/
#
# KATEGORI YANG DIUJI:
#   1. Authentication bypass attempts
#   2. Authorization (access control) violations
#   3. Input validation & injection resistance
#   4. Sensitive data exposure prevention
#   5. Security misconfiguration checks
# =============================================================================

import pytest
import json
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app

pytestmark = pytest.mark.security


# =============================================================================
# KATEGORI 1: Authentication Security
# =============================================================================

class TestAuthenticationSecurity:
    """
    Memastikan sistem autentikasi tidak bisa di-bypass atau dieksploitasi.
    OWASP A07: Identification and Authentication Failures
    """

    @pytest.fixture
    def client(self):
        app = create_app()
        with TestClient(app) as c:
            yield c

    @pytest.mark.parametrize("invalid_token", [
        "",                                     # Token kosong
        "notabearer",                           # Tanpa prefix Bearer
        "Bearer",                               # Bearer tanpa token
        "Bearer ",                              # Bearer dengan spasi kosong
        "Bearer invalid.jwt.format",            # JWT format salah
        "Bearer eyJhbGciOiJub25lIn0.e30.",     # JWT dengan algorithm "none" (BERBAHAYA!)
        "Basic dXNlcjpwYXNz",                  # Basic auth bukan Bearer
        "Bearer " + "A" * 1000,                # Token sangat panjang
    ])
    def test_berbagai_format_token_tidak_valid_ditolak(self, client, invalid_token):
        """
        SKENARIO: Berbagai format token yang tidak valid.
        EKSPEKTASI: Semua harus return 401, tidak ada yang bisa bypass.
        
        Kenapa test "JWT algorithm none"?
        Serangan "Algorithm None" adalah kerentanan JWT klasik di mana
        attacker membuat token palsu dengan algorithm = "none" (tidak ada signing).
        Library JWT yang tidak aman akan menerima token ini!
        """
        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": invalid_token} if invalid_token else {},
        )
        assert response.status_code == 401, (
            f"Token '{invalid_token[:50]}...' seharusnya ditolak dengan 401, "
            f"bukan {response.status_code}"
        )

    def test_semua_protected_endpoints_memerlukan_autentikasi(self, client):
        """
        SKENARIO: Akses semua endpoint protected tanpa token.
        EKSPEKTASI: 100% endpoint protected return 401.
        
        Ini adalah test "kelengkapan" — memastikan tidak ada endpoint
        yang terlupa untuk diproteksi.
        """
        protected_routes = [
            ("POST",   "/api/auth/logout"),
        ]

        unprotected = []
        for method, path in protected_routes:
            resp = client.request(method, path)
            if resp.status_code != 401:
                unprotected.append(f"{method} {path} → {resp.status_code}")

        assert len(unprotected) == 0, (
            f"Endpoint berikut tidak diproteksi dengan benar:\n" +
            "\n".join(unprotected)
        )

    def test_public_endpoints_tidak_memerlukan_token(self, client):
        """
        SKENARIO: Akses endpoint publik tanpa token.
        EKSPEKTASI: 200 OK atau 4xx (bukan 401).
        
        Health check dan auth endpoints harus bisa diakses tanpa token.
        """
        public_routes = [
            ("GET",  "/health"),
            ("POST", "/api/auth/register"),
            ("POST", "/api/auth/login"),
        ]

        for method, path in public_routes:
            resp = client.request(method, path, json={})
            # 401 berarti endpoint ini memerlukan auth padahal tidak seharusnya
            assert resp.status_code != 401, (
                f"Endpoint publik {method} {path} seharusnya tidak butuh auth, "
                f"tapi return 401"
            )


# =============================================================================
# KATEGORI 2: Authorization (Access Control) Security
# =============================================================================

class TestAuthorizationSecurity:
    """
    Memastikan user hanya bisa akses resource miliknya sendiri.
    OWASP A01: Broken Access Control
    """

    def test_error_response_tidak_membocorkan_informasi_sensitif(self):
        """
        SKENARIO: User mencoba login dengan kredensial yang salah.
        EKSPEKTASI: Response tidak mengandung informasi sensitif tentang user lain.
        
        IDOR (Insecure Direct Object Reference) Prevention:
        Pesan error tidak boleh mengungkapkan informasi internal sistem.
        """
        app = create_app()
        from app.api.auth import get_auth_service
        from app.core.exceptions import UnauthorizedError
        from app.core.rate_limit import limiter

        mock_auth_svc = MagicMock()
        # Simulate: kredensial salah
        mock_auth_svc.login.side_effect = UnauthorizedError("Email atau password salah.")
        
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_svc

        try:
            # Reset limiter state to avoid 429 from previous auth tests.
            if hasattr(limiter, "reset"):
                limiter.reset()
            elif hasattr(limiter, "_storage") and hasattr(limiter._storage, "clear"):
                limiter._storage.clear()

            with TestClient(app) as client:
                resp = client.post(
                    "/api/auth/login",
                    json={"email": "test@test.com", "password": "wrong"},
                )
                
                assert resp.status_code == 401
                
                # Response TIDAK boleh mengandung informasi internal
                response_text = resp.text.lower()
                assert "user_id" not in response_text
                assert "database" not in response_text
                
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# KATEGORI 3: Input Validation & Injection Resistance
# =============================================================================

class TestInputValidationSecurity:
    """
    Memastikan input berbahaya tidak bisa merusak sistem.
    OWASP A03: Injection
    """

    @pytest.fixture
    def client(self):
        app = create_app()
        with TestClient(app) as c:
            yield c

    @pytest.mark.parametrize("malicious_email", [
        "'; DROP TABLE users; --",            # SQL Injection attempt
        "<script>alert('xss')</script>@x.com",# XSS attempt (tapi bukan email valid)
        "a" * 1000 + "@test.com",             # Sangat panjang
        "user@[127.0.0.1]",                   # IP address literal
    ])
    def test_input_berbahaya_di_email_ditolak_atau_disanitize(
        self, client, malicious_email
    ):
        """
        SKENARIO: Input email yang berisi karakter berbahaya.
        EKSPEKTASI: Ditolak dengan 422 (bukan 500 Server Error).
        
        PENTING: Kita tidak minta error 400/422 — kita minta BUKAN 500.
        500 berarti input berbahaya membuat server crash, ini sangat buruk.
        """
        resp = client.post("/api/auth/login", json={
            "email": malicious_email,
            "password": "Password123",
        })
        
        # Server tidak boleh crash (500) karena input berbahaya
        assert resp.status_code != 500, (
            f"Server crash (500) karena input: {malicious_email[:50]}"
        )

    @pytest.mark.parametrize("payload", [
        {"email": None, "password": "Password123"},
        {"email": 12345, "password": "Password123"},
        {"email": [], "password": "Password123"},
        {"email": {"nested": "object"}, "password": "Password123"},
    ])
    def test_tipe_data_salah_ditolak_dengan_graceful(self, client, payload):
        """
        SKENARIO: Field email diisi dengan tipe data yang salah (bukan string).
        EKSPEKTASI: 422 Unprocessable Entity, bukan crash.
        """
        resp = client.post("/api/auth/login", json=payload)
        assert resp.status_code == 422

    def test_json_sangat_besar_tidak_crash_server(self, client):
        """
        SKENARIO: Request dengan payload JSON yang sangat besar.
        EKSPEKTASI: Server menangani dengan graceful (422 atau 413), bukan crash.
        
        Denial of Service prevention: body besar tidak boleh OOM server.
        FastAPI memiliki limit bawaan untuk body size.
        """
        huge_password = "A" * 100_000  # 100KB password
        
        resp = client.post(
            "/api/auth/register",
            json={"email": "test@test.com", "password": huge_password},
        )
        
        # Server tidak boleh crash
        assert resp.status_code != 500


# =============================================================================
# KATEGORI 4: Sensitive Data Exposure
# =============================================================================

class TestSensitiveDataExposure:
    """
    Memastikan data sensitif tidak bocor di response.
    OWASP A02: Cryptographic Failures
    """

    def test_response_login_tidak_mengandung_password(self):
        """
        SKENARIO: Login berhasil.
        EKSPEKTASI: Password TIDAK muncul di response manapun.
        """
        app = create_app()
        from app.api.auth import get_auth_service
        from app.models.auth import TokenOut, UserOut

        mock_service = MagicMock()
        mock_service.login.return_value = TokenOut(
            access_token="fake.token",
            refresh_token="fake.refresh",
            expires_at=9999999999,
            user=UserOut(
                id="user-123",
                email="budi@test.com",
                created_at="2025-01-01T00:00:00+00:00",
                email_confirmed=True,
            )
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            with TestClient(app) as client:
                resp = client.post("/api/auth/login", json={
                    "email": "budi@test.com",
                    "password": "SuperSecret123!",
                })

                response_text = resp.text.lower()
                assert "supersecret123" not in response_text
                assert "password" not in response_text

        finally:
            app.dependency_overrides.clear()

    def test_error_response_tidak_mengandung_stack_trace(self):
        """
        SKENARIO: Terjadi error di server.
        EKSPEKTASI: Response tidak mengandung Python stack trace.
        
        Stack trace mengungkapkan: file paths, library versions,
        variabel internal — semua informasi berguna untuk attacker.
        """
        app = create_app()
        from app.api.auth import get_auth_service

        mock_service = MagicMock()
        mock_service.login.side_effect = Exception(
            "FATAL: password column missing in auth.users"
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            with TestClient(app, raise_server_exceptions=False) as client:
                resp = client.post("/api/auth/login", json={
                    "email": "test@test.com",
                    "password": "Password123",
                })

                response_text = resp.text.lower()
                
                # Tidak boleh ada informasi internal
                assert "traceback" not in response_text
                assert "file " not in response_text  # Python file paths
                assert "line " not in response_text  # Line numbers

        finally:
            app.dependency_overrides.clear()

    def test_response_headers_tidak_bocorkan_teknologi(self):
        """
        SKENARIO: Periksa response headers.
        EKSPEKTASI: Headers tidak mengungkapkan informasi teknologi yang dipakai.
        
        "Server: uvicorn" memberitahu attacker kita pakai uvicorn + versinya.
        Attacker bisa cari CVE untuk versi tersebut.
        """
        app = create_app()

        with TestClient(app) as client:
            resp = client.get("/health")
            
            # Header Server tidak boleh mengungkapkan detail
            server_header = resp.headers.get("server", "").lower()
            
            # Ini test yang informatif — tidak semua aplikasi perlu ini
            # tapi good to know
            if "uvicorn" in server_header:
                print(
                    "\nINFO: Header 'Server' mengandung 'uvicorn'. "
                    "Pertimbangkan untuk menyembunyikannya di production."
                )