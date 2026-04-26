from typing import Optional
import logging
from supabase import Client
from postgrest.exceptions import APIError

from app.core.exceptions import NotFoundError, TelegramAlreadyLinkedError

logger = logging.getLogger(__name__)

class ProfileRepository:
    """
    managing all acces data for table 'profiles'
    """

    TABLE = "profiles"

    def __init__(self, client: Client):
        # Keep both names for backward compatibility with existing call sites.
        self.client = client
        self._client = client
    
    def find_by_user_id(self, user_id: str) -> dict:
        """
        take profile data by user_id (UUID Supabase).

        Raises:
            NotFoundError: if profile not found
        """
        try:
            response = (
                self._client
                .table(self.TABLE)
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )
            if not response.data:
                raise NotFoundError(f"Profile for user '{user_id}' not found")
            return response.data
        except NotFoundError:
            raise
        except APIError as e:
            # PostgREST returns PGRST116 when .single() finds 0 rows
            if "PGRST116" in str(e):
                raise NotFoundError(f"Profile for user '{user_id}' not found") from e
            logger.error("Database error fetching profile for user '%s': %s", user_id, str(e)[:200])
            raise
        except Exception as e:
            logger.error("Unexpected error fetching profile for user '%s': %s - %s", user_id, type(e).__name__, str(e)[:200])
            raise
    
    def find_by_telegram_id(self, telegram_chat_id: int) -> Optional[dict]:
        """
        find profile by telegram_chat_id, if not found return None.
        used by bot for find user id by telegram chat id.

        returns:
            dict: profile data if found None: if not found
        """
        response = (
            self._client
            .table(self.TABLE)
            .select("*")
            .eq("telegram_chat_id", telegram_chat_id)
            .execute()
        )
        return response.data[0] if response.data else None
    
    def update(self, user_id: str, update_data: dict) -> dict:
        """
        update profile data by user_id.
        """
        response = (
            self._client
            .table(self.TABLE)
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            raise NotFoundError(f"Profile for user '{user_id}' not found")
        return response.data[0]
    
    def link_telegram(self, user_id: str, telegram_chat_id: int) -> dict:
        """
        link Telegram account to user profile by updating telegram_chat_id field.
        """
        try:
            return self.update(user_id, {"telegram_chat_id": telegram_chat_id})
        except Exception as e:
            if "23505" in str(e) or "unique" in str(e).lower():
                raise TelegramAlreadyLinkedError("This Telegram account is already linked to another profile")
            raise 
    
    def unlink_telegram(self, user_id: str) -> dict:
        """
        unlink Telegram account from user profile by setting telegram_chat_id to None.
        """
        return self.update(user_id, {"telegram_chat_id": None})
    
    def save_connect_code(
            self,
            user_id: str,
            code: str,
            expires_at: str,
    ) -> dict:
        """
        save one time code to profile user.
        every time generate new code, it will override the previous code.
        this is intentional - user can only have one valid code at a time.

        Args:
            user_id (str): user id (UUID Supabase)
            code (str): one time code to connect Telegram account
            expires_at (str): code expiration time in ISO format
        """
        return self.update(user_id, {
            "connect_code": code,
            "connect_code_expires_at": expires_at
        })
    
    def find_by_connect_code(self, code: str) -> Optional[dict]:
        """
        find profile by connect code, if not found return None.
        used by bot for find user id by connect code.

        returns:
            dict: profile data if found None: if not found
        """
        response = (
            self._client
            .table(self.TABLE)
            .select("*")
            .eq("connect_code", code)
            .execute()
        )
        return response.data[0] if response.data else None
    
    def consume_connect_code(self, user_id: str, telegram_chat_id: int) -> dict:
        """
        consume connect code by setting connect_code and connect_code_expires_at to None.
        this is called after successfully link Telegram account, to invalidate the code.
        """
        try:
            return self.update(user_id, {
                "telegram_chat_id": telegram_chat_id,
                "connect_code": None,
                "connect_code_expires_at": None
            })
        except Exception as e:
            if "23505" in str(e) or "unique" in str(e).lower():
                raise TelegramAlreadyLinkedError("This Telegram account is already linked to another profile")
            raise