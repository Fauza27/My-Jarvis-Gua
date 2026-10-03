"""Inspect pending embeddings, or retry a bounded batch with --execute.

Run from backend: python scripts/retry_embeddings.py --limit 20 [--execute]
Only --execute calls the paid embedding API. No transaction amounts are printed.
"""
import argparse
from decimal import Decimal
import json
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.infrastructure.openai_client import get_openai_client
from app.repositories.ai_repository import AIRepository
from app.services.embedding_services import EmbeddingService


class BudgetedEmbeddings:
    """Reserve a conservative UTF-8 byte bound before every paid request.

    Tokenizers for these models encode bytes, so bytes plus overhead bound input
    tokens without installing a tokenizer. Failed requests retain their reserve.
    Prices checked against official model documentation on 2026-10-03.
    """

    PRICES = {"text-embedding-3-small": Decimal("0.02"), "text-embedding-3-large": Decimal("0.13")}

    def __init__(self, client, ceiling: Decimal):
        self.client = client.with_options(max_retries=0, timeout=30)
        self.ceiling = ceiling
        self.reserved = Decimal("0")
        self.tokens = 0
        self.requests = 0
        self.stopped = False

    def create(self, *, model, input, **kwargs):
        rate = self.PRICES.get(model)
        if rate is None:
            self.stopped = True
            raise ValueError("Unknown model price; no paid request made")
        bound = len(input.encode("utf-8")) + 8
        estimate = Decimal(bound) * rate / Decimal(1_000_000)
        if bound > 8192 or self.reserved + estimate > self.ceiling:
            self.stopped = True
            raise ValueError("Input or cost budget exceeded; no paid request made")
        self.reserved += estimate
        self.requests += 1
        response = self.client.embeddings.create(model=model, input=input, **kwargs)
        self.tokens += response.usage.total_tokens
        return response


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int, default=20)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--max-cost-usd', type=Decimal, default=Decimal('0.01'))
    parser.add_argument('--report', type=Path, help='Write aggregate results without transaction data')
    args = parser.parse_args()
    if not 1 <= args.limit <= 100:
        parser.error('--limit must be between 1 and 100')
    if not args.max_cost_usd.is_finite() or args.max_cost_usd <= 0:
        parser.error('--max-cost-usd must be positive and finite')
    repository = AIRepository(get_admin_supabase_client())
    pending = repository.pending_embeddings(args.limit)
    print(f'Pending in this batch: {len(pending)}')
    if not args.execute:
        print('Inspection only. No embedding API calls made.')
        return
    budget = BudgetedEmbeddings(get_openai_client(), args.max_cost_usd)
    service = EmbeddingService(SimpleNamespace(embeddings=budget), repository)
    succeeded = 0
    for row in pending:
        succeeded += service.generate_for_expenses_safe(expense_id=row['id'], amount=0, type='expense')
        if budget.stopped:
            break
    print(f'Completed: {succeeded}; pending or failed: {len(pending) - succeeded}')
    model = service.settings.OPENAI_EMBEDDING_MODEL
    report = {
        'model': model, 'batch_size': len(pending), 'completed': succeeded,
        'requests': budget.requests, 'reported_input_tokens': budget.tokens,
        'reserved_cost_upper_bound_usd': str(budget.reserved),
        'estimated_reported_token_cost_usd': str(Decimal(budget.tokens) * budget.PRICES.get(model, Decimal(0)) / Decimal(1_000_000)),
        'ceiling_usd': str(args.max_cost_usd), 'budget_stopped': budget.stopped,
        'remaining_pending': len(repository.pending_embeddings(100)),
        'pricing_source': 'https://developers.openai.com/api/docs/models/' + model,
    }
    print(json.dumps(report))
    if args.report:
        args.report.write_text(json.dumps(report, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
