import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.repositories.profile_repository import ProfileRepository
from app.models.profile import GenerateConnectCodeResponse, ProfileOut, UpdateProfileRequest
from app.models.auth import MessageOut
from app.core.exceptions import AuthenticationError, NotFoundError, ValidationError

CODE_PREFIX = "MYJARVIS-"
CODE_LENGTH = 6
CODE_EXPIRY_MINUTES = 10

def _generate_code() -> str:
    """Generate secure one-time code for Telegram linking."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    random_part = "".join(secrets.choice(alphabet) for _ in range(CODE_LENGTH))
    return f"{CODE_PREFIX}{random_part}"

class ProfileService:
    """manage all usecase related to profile"""

    def __init__(self, profile_repo: ProfileRepository):
        self._profile_repo = profile_repo
    
    def get_profile(self, user_id: str) -> ProfileOut:
        """
        get profile data by user_id.

        raises:
            NotFoundError: if profile not found
        """
        try:
            profile_data = self._profile_repo.find_by_user_id(user_id)
            return ProfileOut.from_db(profile_data)
        except NotFoundError:
            raise
    
    def update_profile(self, user_id: str, update_request: UpdateProfileRequest) -> ProfileOut:
        """
        update profile data by user_id and update_request.

        raises:
            NotFoundError: if profile not found
            ValidationError: if update data is invalid
        """
        try:
            # check if profile exist
            self._profile_repo.find_by_user_id(user_id)
            # validate update data
            try:
                update_request_dict = update_request.to_update_dict()
            except ValueError as e:
                raise ValidationError(str(e))
            
            if not update_request_dict:
                raise ValidationError("No valid fields to update")
            
            # add updated_at field
            update_request_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # update profile data
            updated_profile_data = self._profile_repo.update(user_id, update_request_dict)
            return ProfileOut.from_db(updated_profile_data)
        except NotFoundError:
            raise

    def link_telegram(self, user_id: str, telegram_chat_id: str) -> MessageOut:
        """
        use case: connect telegram account with account

        called from 2 places:
        1. API endpoint (when user link from web app)
        2. Bot handler (when user link from bot)
        """
        profile = self._profile_repo.find_by_user_id(user_id)

        if profile.get("telegram_chat_id") == telegram_chat_id:
            raise ValidationError("Telegram account is already linked to this profile")
        
        self._profile_repo.link_telegram(user_id, telegram_chat_id)

        return MessageOut(
            message="Telegram account linked successfully"
        )
    
    def unlink_telegram(self, user_id: str) -> MessageOut:
        """ use case: disconnect telegram account from account"""
        self._profile_repo.unlink_telegram(user_id)
        return MessageOut(
            message="Telegram account unlinked successfully"
        )
    
    def get_user_by_telegram_id(self, telegram_chat_id: int) -> Optional[str]:
        """
        find user id by telegram_chat_id, if not found return None.
        used by bot for find user id by telegram chat id.

        returns:
            str: user id if found None: if not found
        """
        return self._profile_repo.find_by_telegram_id(telegram_chat_id)
    
    def generate_connect_code(self, user_id: str) -> GenerateConnectCodeResponse:
        """
        Use case: generate code for linking telegram account, save the code with expiry time in database, and return the code to client.

        called from API endpoint when user request to link telegram account, then user will input the code in bot to complete the linking process.

        every time generate new code, it will override the previous code.

        business rule:
        1. code must be unique (no other user have the same code, even if the code is expired)
        2. code must have expiry time (after expiry time, the code is invalid)
        3. format of code is "MYJARVIS-" + 6 random uppercase letters or digits
        """
        code = _generate_code()
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)).isoformat()

        self._profile_repo.save_connect_code(
            user_id=user_id,
            code=code,
            expires_at=expires_at
        )

        return GenerateConnectCodeResponse(
            code=code,
            expires_in_minutes=CODE_EXPIRY_MINUTES
        )
    
    def verify_and_link_telegram(
        self,
        code: str,
        telegram_chat_id: int,
    ) -> MessageOut:
        """
        Use case: verify code and link telegram account, called from bot handler when user input the code in bot.

        steps:
        1. find profile by code
        2. if not found, return error
        3. if found, check if code is expired
        4. if expired, return error
        5. if not expired, link telegram account with the profile, and invalidate the code

        returns:
            MessageOut: message of the result
        """
        normalized_code = code.strip().upper()
        profile = self._profile_repo.find_by_connect_code(normalized_code)

        if not profile:
            raise AuthenticationError("Invalid or expired connect code")
        
        expires_at_str = profile.get("connect_code_expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(
                    str(expires_at_str).replace("Z", "+00:00")
                )
                now = datetime.now(timezone.utc)

                if now > expires_at:
                    raise AuthenticationError("Invalid or expired connect code")
            except ValueError:
                raise AuthenticationError("Invalid or expired connect code")

        # link telegram account and invalidate the code
        self._profile_repo.consume_connect_code(
            user_id=str(profile["id"]),
            telegram_chat_id=telegram_chat_id
        )

        display_name = profile.get("display_name") or "User"

        return MessageOut(
            message=f"Telegram account linked successfully for {display_name}"
        )