import pytest
import os
from unittest.mock import MagicMock, patch
from faker import Faker
from dotenv import load_dotenv

# Load environment variables from .env file for tests
load_dotenv()

# Faker adalah library untuk generate data palsu yang realistis
# Sangat berguna untuk test agar tidak hard-code "test@test.com"
fake = Faker("id_ID")  # Locale Indonesia


@pytest.fixture(autouse=True)
def _disable_telegram_webhook(monkeypatch):
    """Disable Telegram webhook startup during tests to avoid external calls."""
    monkeypatch.setenv("TELEGRAM_WEBHOOK_URL", "")
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "")
    from app.core.config import get_settings
    get_settings.cache_clear()


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURE: Data Pengguna
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def valid_user_data():
    """
    Data user yang valid — bisa langsung dipakai untuk register/login test.
    Menggunakan Faker agar setiap test run punya data yang unik.
    """
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": fake.email(),
        "password": "Password123",
        "created_at": "2025-01-01T00:00:00+00:00",
    }


@pytest.fixture
def another_user_data():
    """User kedua — untuk test skenario multi-user (security test, RLS test)."""
    return {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "email": fake.email(),
        "password": "AnotherPass456",
        "created_at": "2025-01-02T00:00:00+00:00",
    }


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURE: Mock Supabase Response Objects
#
# Supabase mengembalikan object custom, bukan dict biasa.
# Kita perlu membuat "tiruan" dari object tersebut untuk unit test.
# MagicMock() membuat object palsu yang bisa punya attribute apapun.
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_supabase_user(valid_user_data):
    """
    Mock object yang meniru struktur User dari Supabase.
    Digunakan di unit test agar tidak perlu koneksi nyata.
    """
    mock_user = MagicMock()
    mock_user.id = valid_user_data["id"]
    mock_user.email = valid_user_data["email"]
    mock_user.created_at = valid_user_data["created_at"]
    mock_user.email_confirmed_at = valid_user_data["created_at"]  # Add this
    mock_user.user_metadata = {}
    mock_user.app_metadata = {"provider": "email"}
    return mock_user


@pytest.fixture
def mock_supabase_session(valid_user_data, mock_supabase_user):
    """
    Mock object yang meniru struktur Session dari Supabase.
    Berisi access_token, refresh_token, dan user.
    """
    mock_session = MagicMock()
    mock_session.access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake_token"
    mock_session.refresh_token = "fake_refresh_token_xyz"
    mock_session.expires_at = 9999999999  # Timestamp jauh di masa depan
    return mock_session


@pytest.fixture
def mock_supabase_auth_response(mock_supabase_user, mock_supabase_session):
    """
    Mock object yang meniru AuthResponse dari Supabase.
    Dikembalikan oleh sign_up() dan sign_in_with_password().
    """
    mock_response = MagicMock()
    mock_response.user = mock_supabase_user
    mock_response.session = mock_supabase_session
    return mock_response


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURE: FastAPI TestClient
#
# TestClient memungkinkan kita mengirim HTTP request ke FastAPI
# TANPA perlu menjalankan server sungguhan.
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def test_app():
    """
    Membuat instance aplikasi FastAPI untuk testing.
    Menggunakan create_app() factory sehingga bisa customize konfigurasi.
    """
    # Import di sini untuk menghindari circular import
    from app.core.application import create_app
    return create_app()


@pytest.fixture
def client(test_app):
    """
    FastAPI TestClient yang sudah siap dipakai.
    
    Cara penggunaan:
        def test_health(client):
            response = client.get("/health")
            assert response.status_code == 200
    """
    from fastapi.testclient import TestClient
    with TestClient(test_app) as c:
        yield c


@pytest.fixture
def authenticated_client(client, valid_user_data, mock_supabase_auth_response):
    """
    TestClient yang sudah memiliki token autentikasi.
    Digunakan untuk test endpoint yang memerlukan login.
    
    Mengembalikan tuple (client, token) agar test bisa akses token jika perlu.
    """
    token = mock_supabase_auth_response.session.access_token
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client, token


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURE: Mock Repositories
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_auth_repo():
    """
    Mock AuthRepository untuk dipakai di unit test service.
    Semua method tersedia sebagai MagicMock yang bisa di-configure.
    """
    return MagicMock()


@pytest.fixture
def mock_expense_repo():
    """Mock ExpenseRepository untuk unit test ExpenseService."""
    return MagicMock()


@pytest.fixture
def mock_embedding_service():
    """Mock EmbeddingService untuk memastikan task dipanggil."""
    return MagicMock()


@pytest.fixture
def mock_profile_repo():
    """Mock ProfileRepository untuk unit test ProfileService."""
    return MagicMock()


@pytest.fixture
def mock_ai_service():
    """Mock AIService untuk endpoint test."""
    return MagicMock()