"""Offline checks for the retry worker's paid-request guard."""
import sys
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'backend'))
from scripts.retry_embeddings import BudgetedEmbeddings

class FakeClient:
    def __init__(self):
        self.calls = 0
        self.embeddings = self

    def with_options(self, **kwargs):
        assert kwargs['max_retries'] == 0
        return self

    def create(self, **kwargs):
        self.calls += 1
        return SimpleNamespace(usage=SimpleNamespace(total_tokens=3))

for model, text, ceiling in [
    ('unknown-model', 'small', '0.01'),
    ('text-embedding-3-small', 'small', '0.00000001'),
    ('text-embedding-3-small', 'x' * 8193, '1'),
]:
    client = FakeClient()
    guard = BudgetedEmbeddings(client, Decimal(ceiling))
    try:
        guard.create(model=model, input=text)
        raise AssertionError('Unsafe request was accepted')
    except ValueError:
        assert guard.stopped and client.calls == 0

client = FakeClient()
guard = BudgetedEmbeddings(client, Decimal('0.01'))
guard.create(model='text-embedding-3-small', input='small')
assert client.calls == 1 and guard.tokens == 3 and guard.reserved < guard.ceiling
print('PASS: unknown price, budget overflow, oversized input blocked; bounded request succeeds.')
