import pytest
from unittest.mock import MagicMock

from app.repositories.profile_repository import ProfileRepository
from app.core.exceptions import NotFoundError

pytestmark = pytest.mark.unit


def make_query_mock(response: MagicMock) -> MagicMock:
    query = MagicMock()
    query.select.return_value = query
    query.update.return_value = query
    query.eq.return_value = query
    query.single.return_value = query
    query.execute.return_value = response
    return query


class TestProfileRepository:

    def test_find_by_user_id_not_found(self):
        response = MagicMock()
        response.data = None
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ProfileRepository(client=client)

        with pytest.raises(NotFoundError):
            repo.find_by_user_id(user_id="user-1")

    def test_update_not_found(self):
        response = MagicMock()
        response.data = None
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ProfileRepository(client=client)

        with pytest.raises(NotFoundError):
            repo.update(user_id="user-1", update_data={"display_name": "x"})
