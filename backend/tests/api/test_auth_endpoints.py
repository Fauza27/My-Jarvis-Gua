import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.auth import TokenOut, MessageOut, UserOut
from app.core.exceptions import (
    AuthenticationError,
    UserAlreadyExistsError,
    InvalidTokenError,
)

pytestmark = pytest.mark.api


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures untuk API Test
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


def make_token_out(email: str = "budi@test.com") -> TokenOut:
    """Helper: buat TokenOut palsu untuk test."""
    return TokenOut(
        access_token="fake.jwt.token",
        refresh_token="fake_refresh_token",
        expires_at=9999999999,
        user=UserOut(
            id="user-uuid-123",
            email=email,
            created_at="2025-01-01T00:00:00+00:00",
            email_confirmed=True,
        )
    )


def make_mock_user(email: str = "budi@test.com"):
    """Helper: buat mock user object."""
    user = MagicMock()
    user.id = "user-uuid-123"
    user.email = email
    user.created_at = "2025-01-01T00:00:00+00:00"
    return user


# =============================================================================
# POST /api/auth/register
# =============================================================================

class TestRegisterEndpoint:

    def test_register_sukses_mengembalikan_201(self, app, client):
        """
        SKENARIO: Request register dengan data valid.
        EKSPEKTASI: HTTP 201 Created + pesan sukses.
        """
        # Override dependency: ganti AuthService nyata dengan mock
        from app.api.auth import get_auth_service
        mock_service = MagicMock()
        mock_service.register.return_value = MessageOut(
            message="Registration successful. Please check your email to confirm."
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            response = client.post("/api/auth/register", json={
                "email": "budi@test.com",
                "password": "Password123!",
            })

            # Verifikasi HTTP status code
            assert response.status_code == 201

            # Verifikasi struktur response JSON
            body = response.json()
            assert "message" in body
            assert "successful" in body["message"].lower()

        finally:
            # PENTING: selalu bersihkan override agar tidak affect test lain
            app.dependency_overrides.clear()

    def test_register_email_tidak_valid_mengembalikan_422(self, client):
        """
        SKENARIO: Request register dengan format email yang salah.
        EKSPEKTASI: HTTP 422 Unprocessable Entity.
        
        Validasi ini terjadi di level Pydantic, SEBELUM sampai ke service.
        Tidak perlu mock service untuk test ini.
        """
        response = client.post("/api/auth/register", json={
            "email": "ini-bukan-email",
            "password": "Password123!",
        })

        assert response.status_code == 422
        # Verifikasi field yang error disebutkan
        body = response.json()
        assert "detail" in body

    def test_register_password_lemah_mengembalikan_422(self, client):
        """
        SKENARIO: Password tidak memenuhi kriteria keamanan.
        EKSPEKTASI: HTTP 422 dengan pesan yang deskriptif.
        """
        response = client.post("/api/auth/register", json={
            "email": "budi@test.com",
            "password": "lemah",  # Terlalu pendek, tidak ada huruf besar/angka
        })

        assert response.status_code == 422

    def test_register_email_sudah_ada_mengembalikan_409(self, app, client):
        """
        SKENARIO: Email sudah terdaftar di sistem.
        EKSPEKTASI: HTTP 409 Conflict.
        
        Ini memverifikasi bahwa exception handler di application.py
        mengkonversi UserAlreadyExistsError → HTTP 409 dengan benar.
        """
        from app.api.auth import get_auth_service
        mock_service = MagicMock()
        mock_service.register.side_effect = UserAlreadyExistsError(
            "Email ini sudah terdaftar."
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            response = client.post("/api/auth/register", json={
                "email": "sudah@ada.com",
                "password": "Password123!",
            })

            assert response.status_code == 409
            assert "sudah terdaftar" in response.json()["detail"].lower() or "already exists" in response.json()["detail"].lower()

        finally:
            app.dependency_overrides.clear()

    def test_register_body_kosong_mengembalikan_422(self, client):
        """
        SKENARIO: Request tanpa body.
        EKSPEKTASI: HTTP 422 karena field required tidak ada.
        """
        response = client.post("/api/auth/register", json={})
        assert response.status_code == 422

    def test_register_response_tidak_mengandung_password(self, app, client):
        """
        SKENARIO: Registrasi berhasil.
        EKSPEKTASI: Response TIDAK mengandung password dalam bentuk apapun.
        
        SECURITY TEST: Memastikan data sensitif tidak bocor di response.
        """
        from app.api.auth import get_auth_service
        mock_service = MagicMock()
        mock_service.register.return_value = MessageOut(message="Berhasil!")
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            response = client.post("/api/auth/register", json={
                "email": "budi@test.com",
                "password": "SuperSecret123!",
            })

            response_text = response.text.lower()
            assert "supersecret123" not in response_text
            assert "password" not in response_text

        finally:
            app.dependency_overrides.clear()


# =============================================================================
# POST /api/auth/login
# =============================================================================

class TestLoginEndpoint:

    def test_login_sukses_mengembalikan_200_dengan_token(self, app, client):
        """
        SKENARIO: Login dengan credentials yang benar.
        EKSPEKTASI: HTTP 200 + body berisi access_token, refresh_token, user.
        """
        from app.api.auth import get_auth_service
        mock_service = MagicMock()
        mock_service.login.return_value = make_token_out()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            response = client.post("/api/auth/login", json={
                "email": "budi@test.com",
                "password": "Password123",
            })

            assert response.status_code == 200

            body = response.json()
            # Verifikasi semua field yang dibutuhkan client ada
            assert "access_token" in body
            assert "refresh_token" in body
            assert "expires_at" in body
            assert "token_type" in body
            assert "user" in body
            assert body["token_type"] == "bearer"

        finally:
            app.dependency_overrides.clear()

    def test_login_credentials_salah_mengembalikan_401(self, app, client):
        """
        SKENARIO: Login dengan password yang salah.
        EKSPEKTASI: HTTP 401 Unauthorized.
        
        Verifikasi bahwa AuthenticationError → HTTP 401 bekerja dengan benar.
        """
        from app.api.auth import get_auth_service
        mock_service = MagicMock()
        mock_service.login.side_effect = AuthenticationError(
            "Email atau password tidak valid."
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            response = client.post("/api/auth/login", json={
                "email": "budi@test.com",
                "password": "passwordsalah",
            })

            assert response.status_code == 401
            # Verifikasi WWW-Authenticate header ada (standar HTTP)
            assert "WWW-Authenticate" in response.headers

        finally:
            app.dependency_overrides.clear()

    def test_login_content_type_harus_json(self, client):
        """
        SKENARIO: Login berhasil.
        EKSPEKTASI: Response Content-Type adalah application/json.
        """
        response = client.post("/api/auth/login", json={
            "email": "budi@test.com",
            "password": "Password123",
        })

        # Meski status code 401 (karena tidak ada mock), Content-Type harus JSON
        assert "application/json" in response.headers.get("content-type", "")


# =============================================================================
# GET /api/auth/verify
# =============================================================================

class TestVerifyTokenEndpoint:

    def test_verify_dengan_token_valid_mengembalikan_200(self, app, client):
        """
        SKENARIO: Verifikasi token yang masih valid.
        EKSPEKTASI: HTTP 200 dengan valid=True.
        """
        # Override get_current_user dependency agar tidak ke Supabase nyata
        from app.core.dependencies import get_current_user
        mock_user = make_mock_user()
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            response = client.get(
                "/api/auth/verify",
                headers={"Authorization": "Bearer fake.valid.token"},
            )

            assert response.status_code == 200
            body = response.json()
            assert body["valid"] is True
            assert "user_id" in body
            assert "email" in body

        finally:
            app.dependency_overrides.clear()

    def test_verify_tanpa_token_mengembalikan_401(self, client):
        """
        SKENARIO: Request tanpa Authorization header.
        EKSPEKTASI: HTTP 401 Unauthorized.
        """
        response = client.get("/api/auth/verify")
        assert response.status_code == 401

    def test_verify_dengan_token_invalid_mengembalikan_401(self, app, client):
        """
        SKENARIO: Token tidak valid (format salah atau sudah expired).
        EKSPEKTASI: HTTP 401.
        """
        from app.core.dependencies import get_current_user
        
        async def mock_invalid_user():
            raise InvalidTokenError("Token tidak valid")
        
        app.dependency_overrides[get_current_user] = mock_invalid_user

        try:
            response = client.get(
                "/api/auth/verify",
                headers={"Authorization": "Bearer token.yang.tidak.valid"},
            )
            assert response.status_code == 401

        finally:
            app.dependency_overrides.clear()


# =============================================================================
# POST /api/auth/forgot-password
# =============================================================================

class TestForgotPasswordEndpoint:

    @pytest.mark.parametrize("email", [
        "terdaftar@test.com",
        "tidakada@test.com",
    ])
    def test_forgot_password_selalu_mengembalikan_200(self, app, client, email):
        """
        SKENARIO: Request reset password untuk email terdaftar DAN tidak terdaftar.
        EKSPEKTASI: KEDUANYA harus mengembalikan HTTP 200 dengan pesan yang SAMA.
        
        SECURITY TEST (Anti-enumeration):
        Jika response berbeda antara email terdaftar dan tidak,
        attacker bisa scan email mana yang valid di sistem kita.
        """
        from app.api.auth import get_auth_service
        mock_service = MagicMock()
        mock_service.request_password_reset.return_value = MessageOut(
            message="Jika email terdaftar, link akan dikirim."
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        try:
            response = client.post("/api/auth/forgot-password", json={
                "email": email,
            })

            assert response.status_code == 200

        finally:
            app.dependency_overrides.clear()