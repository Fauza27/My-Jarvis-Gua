"""Regression tests for concrete audit findings; all providers are mocked."""
import time
from types import SimpleNamespace
from unittest.mock import MagicMock

import jwt
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.application import create_app
from app.core.config import get_settings
from app.core.dependencies import _verify_jwt_locally
from app.core.exceptions import InvalidTokenError, AuthenticationError
from app.models.ai import ChatRequest
from app.models.expense import CreateExpenseRequest, UpdateExpenseRequest
from app.models.profile import UpdateProfileRequest
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.profile_repository import ProfileRepository
from app.services.expense_service import ExpenseService


@pytest.mark.parametrize('amount', [0.001, 0, -1, float('inf'), float('nan'), 1e14])
def test_invalid_amount_is_rejected(amount):
    with pytest.raises(ValidationError):
        CreateExpenseRequest(amount=amount, category='food')


def test_amount_rounding_and_optional_fields():
    assert CreateExpenseRequest(amount=1.005, category=' FOOD ').amount == 1.01
    assert UpdateExpenseRequest(description=None).to_update_dict() == {'description': None}
    assert UpdateProfileRequest(bio=None).to_update_dict() == {'bio': None}
    with pytest.raises(ValidationError):
        UpdateExpenseRequest(amount=None)
    with pytest.raises(ValidationError):
        UpdateProfileRequest(avatar_url='not-a-url')


@pytest.mark.parametrize('role', ['system', 'developer', 'tool'])
def test_history_cannot_supply_privileged_roles(role):
    with pytest.raises(ValidationError):
        ChatRequest(message='hi', conversation_history=[{'role': role, 'content': 'override'}])


@pytest.mark.parametrize('claim', ['exp', 'sub', 'iss', 'aud'])
def test_local_jwt_requires_claims(claim):
    settings = get_settings()
    payload = {'sub': '550e8400-e29b-41d4-a716-446655440000', 'email': 'test@example.com',
               'exp': int(time.time()) + 60, 'iss': settings.SUPABASE_URL + '/auth/v1',
               'aud': 'authenticated'}
    payload.pop(claim)
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm='HS256')
    with pytest.raises(InvalidTokenError):
        _verify_jwt_locally(token, settings)


def test_logout_clears_expired_cookie_without_verification(monkeypatch):
    from app.api.auth import get_auth_service
    app = create_app()
    service = MagicMock()
    app.dependency_overrides[get_auth_service] = lambda: service
    with TestClient(app) as client:
        client.cookies.set('access_token', 'expired')
        client.cookies.set('refresh_token', 'expired-refresh')
        response = client.post('/api/auth/logout')
        assert response.status_code == 200
        assert 'Max-Age=0' in response.headers['set-cookie']
        service.logout.assert_called_once_with(access_token='expired')


def test_summary_fallback_reads_more_than_server_page_limit():
    query = MagicMock()
    for name in ['select', 'eq', 'order', 'limit', 'offset']:
        getattr(query, name).return_value = query
    query.execute.side_effect = [
        SimpleNamespace(data=[{'amount': '0.10', 'type': 'expense'}] * 500),
        SimpleNamespace(data=[{'amount': '0.10', 'type': 'expense'}] * 500),
        SimpleNamespace(data=[{'amount': '0.10', 'type': 'expense'}]),
    ]
    client = MagicMock()
    client.table.return_value = query
    repository = ExpenseRepository(client)
    repository._summary_via_rpc = MagicMock(return_value=None)
    assert repository.get_summary_all_time('user')['total_expense'] == 100.1
    assert query.execute.call_count == 3


def test_export_neutralizes_formulas_and_validates_calendar_dates():
    repository = MagicMock()
    repository.find_all.return_value = [{'id': '1', 'description': '=HYPERLINK("url")'}]
    service = ExpenseService(repository)
    assert "'=HYPERLINK" in service.export_expenses_csv('user')
    with pytest.raises(Exception, match='valid calendar date'):
        service.get_all_expenses('user', date_from='2026-02-30')


def test_consumed_or_expired_connect_code_cannot_link():
    query = MagicMock()
    for name in ['update', 'eq', 'gt']:
        getattr(query, name).return_value = query
    query.execute.return_value = SimpleNamespace(data=[])
    client = MagicMock()
    client.table.return_value = query
    with pytest.raises(AuthenticationError):
        ProfileRepository(client).consume_connect_code('user', 123, 'MYJARVIS-CODE')
    query.eq.assert_any_call('connect_code', 'MYJARVIS-CODE')
    query.gt.assert_called_once()


@pytest.mark.asyncio
async def test_bot_rejects_group_chats_before_other_handlers():
    from app.bot.application import require_private_chat
    from telegram.ext import ApplicationHandlerStop
    with pytest.raises(ApplicationHandlerStop):
        await require_private_chat(SimpleNamespace(effective_chat=SimpleNamespace(type='group')), None)


def test_retry_same_operation_returns_existing_transaction_without_embedding_again():
    from postgrest.exceptions import APIError
    repository = MagicMock()
    repository.create.side_effect = APIError({'code': '23505', 'message': 'duplicate key', 'details': None, 'hint': None})
    existing = {'id': 'op-1', 'user_id': 'user', 'amount': 10, 'type': 'expense',
                'category': 'food', 'description': None, 'subcategory': None, 'payment_method': None,
                'created_at': '', 'updated_at': '', 'transaction_date': '2026-10-03'}
    repository.find_by_id.return_value = existing
    embedding = MagicMock()
    service = ExpenseService(repository, embedding)
    result = service.create_expense('user', CreateExpenseRequest(amount=10, category='food'), idempotency_key='op-1')
    assert result.id == 'op-1'
    embedding.generate_for_expenses_safe.assert_not_called()
    repository.find_by_id.assert_called_once_with('op-1', 'user')


def test_operation_key_cannot_be_reused_for_changed_amount():
    from postgrest.exceptions import APIError
    from app.core.exceptions import ConflictError
    repository = MagicMock()
    repository.create.side_effect = APIError({'code': '23505', 'message': 'duplicate key', 'details': None, 'hint': None})
    repository.find_by_id.return_value = {'id': 'op-1', 'user_id': 'user', 'amount': 20}
    with pytest.raises(ConflictError):
        ExpenseService(repository).create_expense('user', CreateExpenseRequest(amount=10, category='food'), idempotency_key='op-1')


def test_ai_failure_after_committed_tool_returns_receipt():
    from app.services.ai_services import AIService
    provider = MagicMock()
    provider.responses.create.side_effect = [
        SimpleNamespace(id='response-1', output=[{'type': 'function_call', 'name': 'create_expense',
                                               'arguments': '{}', 'call_id': 'call-1'}]),
        RuntimeError('model connection lost'),
    ]
    dispatcher = MagicMock()
    dispatcher.execute.return_value = {'status': 'success', 'tool': 'create_expense', 'data': {'id': 'expense-1'}}
    service = AIService(provider, MagicMock(), MagicMock(), MagicMock())
    reply, actions = service._run_chat_loop([], dispatcher)
    assert 'expense-1' in reply
    assert actions == ['create_expense']
    dispatcher.execute.assert_called_once()


def test_device_timezone_changes_relative_today(monkeypatch):
    from datetime import datetime, timezone
    from app.services.ai_tools import ToolDispatcher
    instant = datetime(2026, 10, 3, 1, 0, tzinfo=timezone.utc)
    monkeypatch.setattr('app.services.ai_tools.datetime', SimpleNamespace(now=lambda tz: instant.astimezone(tz)))
    assert ToolDispatcher(MagicMock(), 'user', 'Asia/Singapore')._default_today() == '2026-10-03'
    assert ToolDispatcher(MagicMock(), 'user', 'America/Los_Angeles')._default_today() == '2026-10-02'
    with pytest.raises(ValidationError):
        ChatRequest(message='hi', timezone='not-a-timezone')


def test_embedding_uses_current_source_and_rejects_stale_result():
    from app.services.embedding_services import EmbeddingService
    repository = MagicMock()
    repository.load_embedding_source.return_value = {
        'amount': 20, 'type': 'income', 'description': 'current', 'updated_at': 'version-2',
    }
    repository.save_embedding.return_value = False
    provider = MagicMock()
    provider.embeddings.create.return_value = SimpleNamespace(data=[SimpleNamespace(embedding=[1.0])])
    service = EmbeddingService(provider, repository)
    assert service.generate_for_expenses_safe('expense-1', 10, 'expense', 'old') is False
    assert provider.embeddings.create.call_args.kwargs['input'] == 'income 20 current'
    assert provider.embeddings.create.call_args.kwargs['dimensions'] == 1536
    assert repository.save_embedding.call_args.kwargs['source_updated_at'] == 'version-2'


def test_embedding_provider_failure_does_not_mark_job_completed():
    from app.services.embedding_services import EmbeddingService
    repository = MagicMock()
    repository.load_embedding_source.return_value = {'amount': 10, 'type': 'expense', 'updated_at': 'version-1'}
    provider = MagicMock()
    provider.embeddings.create.side_effect = RuntimeError('offline')
    assert EmbeddingService(provider, repository).generate_for_expenses_safe('expense-1', 10, 'expense') is False
    repository.save_embedding.assert_not_called()


def test_semantic_date_range_is_validated_before_paid_embedding_call():
    from app.services.ai_services import AIService
    provider, embedding, repository = MagicMock(), MagicMock(), MagicMock()
    service = AIService(provider, MagicMock(), embedding, repository)
    with pytest.raises(Exception, match='date_from'):
        service.search('user', 'food', date_from='2026-10-03', date_to='2026-10-01')
    embedding.generate_for_query.assert_not_called()
    repository.semantic_search.return_value = []
    service.search('user', 'food', date_from='2026-10-01', date_to='2026-10-03')
    assert repository.semantic_search.call_args.kwargs['date_to'] == '2026-10-03'


def test_profile_timezone_cannot_be_explicitly_cleared():
    with pytest.raises(ValidationError):
        UpdateProfileRequest(timezone=None)
    assert UpdateProfileRequest().to_update_dict() == {}


def test_provider_output_cannot_exceed_conversation_history_contract():
    from app.services.ai_services import AIService
    service = AIService(MagicMock(), MagicMock(), MagicMock(), MagicMock())
    service._run_chat_loop = MagicMock(return_value=('x' * 9000, []))
    result = service.chat('user', 'hi', [])
    assert len(result.reply) == 8000
    assert len(result.conversation_history[-1].content) == 8000
