import pytest
from unittest.mock import MagicMock

from app.services.profile_service import ProfileService, CODE_PREFIX
from app.models.profile import UpdateProfileRequest
from app.core.exceptions import ValidationError, AuthenticationError

pytestmark = pytest.mark.unit


def make_profile_dict() -> dict:
    return {
        "id": "user-1",
        "display_name": "Budi",
        "bio": None,
        "avatar_url": None,
        "telegram_chat_id": None,
        "auth_provider": "email",
        "created_at": "2026-04-01T00:00:00+00:00",
        "updated_at": "2026-04-01T00:00:00+00:00",
    }


class TestProfileService:

    def test_update_profile_validates_fields(self, mock_profile_repo):
        mock_profile_repo.find_by_user_id.return_value = make_profile_dict()
        service = ProfileService(profile_repo=mock_profile_repo)
        request = UpdateProfileRequest()

        with pytest.raises(ValidationError):
            service.update_profile(user_id="user-1", update_request=request)

    def test_generate_connect_code(self, mock_profile_repo):
        service = ProfileService(profile_repo=mock_profile_repo)
        result = service.generate_connect_code(user_id="user-1")

        assert result.code.startswith(CODE_PREFIX)
        mock_profile_repo.save_connect_code.assert_called_once()

    def test_verify_and_link_telegram_invalid_code(self, mock_profile_repo):
        mock_profile_repo.find_by_connect_code.return_value = None
        service = ProfileService(profile_repo=mock_profile_repo)

        with pytest.raises(AuthenticationError):
            service.verify_and_link_telegram(code="BAD", telegram_chat_id=123)
