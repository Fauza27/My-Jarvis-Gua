import pytest
from pydantic import ValidationError

from app.models.auth import RegisterRequest, LoginRequest

# =============================================================================

class TestRegisterRequest:
    """Menguji validasi model untuk request registrasi."""

    # ── Valid cases ───────────────────────────────────────────────────────────

    @pytest.mark.parametrize("valid_password", [
        "Password123!",     # Minimal valid
        "MyStrongP4ss!",    # Dengan karakter spesial
        "UPPER1lower!",     # Variasi huruf besar/kecil
        "a" * 7 + "A1!",   # Tepat 9 karakter
    ])
    def test_password_valid_diterima(self, valid_password):
        """Password yang memenuhi semua kriteria harus diterima."""
        request = RegisterRequest(email="test@test.com", password=valid_password)
        assert request.password == valid_password

    def test_email_valid_diterima(self):
        """Email dengan format yang benar harus diterima."""
        request = RegisterRequest(email="budi@taskly.com", password="Password123!")
        assert request.email == "budi@taskly.com"

    # ── Invalid cases ─────────────────────────────────────────────────────────

    @pytest.mark.parametrize("invalid_password,expected_error", [
        ("short1A",       "8 characters"),      # Terlalu pendek (7 char)
        ("alllowercase1", "uppercase"),         # Tidak ada huruf besar
        ("ALLUPPERCASE1", "lowercase"),         # Tidak ada huruf kecil
        ("NoNumbersHere", "digit"),             # Tidak ada angka
        ("",              "8 characters"),      # Kosong
    ])
    def test_password_tidak_valid_ditolak(self, invalid_password, expected_error):
        """
        Password yang tidak memenuhi kriteria harus ditolak dengan pesan yang jelas.
        
        Cara membaca:
        - "short1A" ditolak dengan pesan yang mengandung "8 karakter"
        - "alllowercase1" ditolak dengan pesan yang mengandung "huruf besar"
        dst.
        """
        with pytest.raises(ValidationError) as exc_info:
            RegisterRequest(email="test@test.com", password=invalid_password)

        # Verifikasi pesan error mengandung hint yang relevan
        assert expected_error in str(exc_info.value).lower()

    @pytest.mark.parametrize("invalid_email", [
        "bukan-email",
        "tanpa@domain",
        "@nodomain.com",
        "spasi di email@test.com",
        "",
    ])
    def test_email_tidak_valid_ditolak(self, invalid_email):
        """Email dengan format yang salah harus ditolak."""
        with pytest.raises(ValidationError):
            RegisterRequest(email=invalid_email, password="Password123")
