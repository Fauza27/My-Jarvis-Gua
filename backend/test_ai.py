"""
Comprehensive integration test for AI endpoints + tool dispatcher.

Coverage:
1) Single chat (no tool expected)
2) Chat with function call (create expense)
3) Multi-turn conversation
4) Semantic search
5) Direct test for each tool in ai_tools.py

Run:
  set ACCESS_TOKEN=<your_jwt_token>
  python test_ai.py
"""

from __future__ import annotations

import base64
import json
import os
from datetime import datetime

import requests

from app.infrastructure.supabase_client import get_user_client
from app.repositories.expense_repository import ExpenseRepository
from app.services.ai_tools import ToolDispatcher
from app.services.expense_service import ExpenseService

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000/api")
TOKEN = os.getenv("ACCESS_TOKEN", "")


def separator(title: str) -> None:
    print(f"\n{'=' * 78}")
    print(f"  {title}")
    print(f"{'=' * 78}")


def ok(name: str, detail: str = "") -> None:
    suffix = f" - {detail}" if detail else ""
    print(f"[PASS] {name}{suffix}")


def fail(name: str, detail: str = "") -> None:
    suffix = f" - {detail}" if detail else ""
    print(f"[FAIL] {name}{suffix}")


def get_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def decode_jwt_sub(token: str) -> str:
    """Decode JWT payload without verification and return `sub` as user_id."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")

    payload = parts[1]
    payload += "=" * (-len(payload) % 4)
    raw = base64.urlsafe_b64decode(payload.encode("utf-8"))
    data = json.loads(raw.decode("utf-8"))

    sub = data.get("sub")
    if not sub:
        raise ValueError("JWT payload has no 'sub'")
    return str(sub)


def chat(message: str, token: str, history: list[dict] | None = None) -> tuple[bool, dict | None]:
    payload = {
        "message": message,
        "conversation_history": history or [],
    }
    resp = requests.post(
        f"{BASE_URL}/ai/chat",
        headers=get_headers(token),
        json=payload,
        timeout=90,
    )
    if resp.status_code != 200:
        fail("Chat request", f"status={resp.status_code}, body={resp.text[:250]}")
        return False, None

    data = resp.json()
    print(f"User: {message}")
    print(f"AI:   {data.get('reply', '')[:220]}")
    if data.get("action_taken"):
        print(f"Tools called: {data['action_taken']}")
    return True, data


def semantic_search(query: str, token: str) -> tuple[bool, dict | None]:
    resp = requests.get(
        f"{BASE_URL}/ai/search",
        headers=get_headers(token),
        params={"q": query, "threshold": 0.2, "limit": 5},
        timeout=60,
    )
    if resp.status_code != 200:
        fail("Semantic search", f"status={resp.status_code}, body={resp.text[:250]}")
        return False, None
    return True, resp.json()


def make_dispatcher(token: str) -> tuple[ToolDispatcher, str]:
    user_id = decode_jwt_sub(token)
    user_client = get_user_client(access_token=token)
    expense_service = ExpenseService(expense_repo=ExpenseRepository(client=user_client))
    dispatcher = ToolDispatcher(expense_service=expense_service, user_id=user_id)
    return dispatcher, user_id


def run_tool(dispatcher: ToolDispatcher, tool_name: str, args: dict) -> dict:
    return dispatcher.execute(tool_name, json.dumps(args))


def test_single_chat(token: str) -> bool:
    separator("TEST 1 - Single Chat (no tool expected)")
    passed, data = chat(
        "Jelaskan singkat bedanya pemasukan dan pengeluaran dalam satu paragraf.",
        token=token,
        history=[],
    )
    if not passed or not data:
        return False

    actions = data.get("action_taken", [])
    if actions:
        fail("Single chat", f"unexpected tools={actions}")
        return False

    ok("Single chat", "response returned without tool")
    return True


def test_chat_function_call_create(token: str) -> tuple[bool, list[dict]]:
    separator("TEST 2 - Chat Function Call (create expense)")
    today = datetime.utcnow().strftime("%Y-%m-%d")
    message = (
        f"Tolong catat pengeluaran 34567 untuk kopi susu kategori makanan, "
        f"deskripsi test function call, tanggal {today}"
    )
    passed, data = chat(message, token=token, history=[])
    if not passed or not data:
        return False, []

    actions = data.get("action_taken", [])
    if "create_expense" not in actions:
        fail("Function call create", f"action_taken={actions}")
        return False, data.get("conversation_history", [])

    ok("Function call create", f"action_taken={actions}")
    return True, data.get("conversation_history", [])


def test_multi_turn(token: str, history: list[dict]) -> bool:
    separator("TEST 3 - Multi Turn Conversation")
    if not history:
        fail("Multi turn", "history empty from previous test")
        return False

    passed2, data2 = chat("Berapa total pengeluaran saya bulan ini?", token=token, history=history)
    if not passed2 or not data2:
        return False

    history2 = data2.get("conversation_history", [])
    passed3, data3 = chat(
        "Sekarang catat pemasukan 120000 dari freelance kategori pendapatan hari ini.",
        token=token,
        history=history2,
    )
    if not passed3 or not data3:
        return False

    actions = data3.get("action_taken", [])
    if "create_expense" not in actions:
        fail("Multi turn create", f"action_taken={actions}")
        return False

    ok("Multi turn conversation", f"final history_len={len(data3.get('conversation_history', []))}")
    return True


def test_semantic_search(token: str) -> bool:
    separator("TEST 4 - Semantic Search")
    passed, data = semantic_search("kopi susu jajan", token)
    if not passed or not data:
        return False

    print(f"Query: {data.get('query')}")
    print(f"Total results: {data.get('total')}")
    for i, item in enumerate(data.get("results", []), 1):
        print(
            f"  {i}. amount={item.get('amount')} type={item.get('type')} "
            f"category={item.get('category')} similarity={item.get('similarity')}"
        )

    ok("Semantic search", "endpoint returned 200")
    return True


def test_each_tool(token: str) -> bool:
    separator("TEST 5 - Each Tool via ToolDispatcher")
    dispatcher, _ = make_dispatcher(token)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    year = datetime.utcnow().year
    month = datetime.utcnow().month

    all_passed = True

    # 1) create_expense
    create_payload = {
        "amount": 77777,
        "type": "expense",
        "category": "testing-tool",
        "description": "created by tool test",
        "subcategory": None,
        "payment_method": None,
        "transaction_date": today,
    }
    create_result = run_tool(dispatcher, "create_expense", create_payload)
    if create_result.get("status") != "success":
        fail("tool:create_expense", str(create_result)[:200])
        return False
    created_id = create_result.get("data", {}).get("id")
    ok("tool:create_expense", f"id={created_id}")

    # 2) list_expenses
    list_payload = {
        "limit": 20,
        "offset": 0,
        "type": None,
        "category": "testing-tool",
        "q": None,
        "date_from": None,
        "date_to": None,
        "sort_by": "created_at",
        "sort_order": "desc",
    }
    list_result = run_tool(dispatcher, "list_expenses", list_payload)
    if list_result.get("status") != "success":
        fail("tool:list_expenses", str(list_result)[:200])
        all_passed = False
    else:
        total = list_result.get("data", {}).get("total", 0)
        ok("tool:list_expenses", f"total={total}")

    # 3) update_expense
    update_payload = {
        "expense_id": created_id,
        "amount": 88888,
        "type": None,
        "description": "updated by tool test",
        "category": None,
        "subcategory": None,
        "payment_method": None,
        "transaction_date": None,
    }
    update_result = run_tool(dispatcher, "update_expense", update_payload)
    if update_result.get("status") != "success":
        fail("tool:update_expense", str(update_result)[:200])
        all_passed = False
    else:
        ok("tool:update_expense", "updated")

    # 4) get_monthly_summary
    monthly_result = run_tool(dispatcher, "get_monthly_summary", {"month": month, "year": year})
    if monthly_result.get("status") != "success":
        fail("tool:get_monthly_summary", str(monthly_result)[:200])
        all_passed = False
    else:
        ok("tool:get_monthly_summary")

    # 5) get_yearly_summary
    yearly_result = run_tool(dispatcher, "get_yearly_summary", {"year": year})
    if yearly_result.get("status") != "success":
        fail("tool:get_yearly_summary", str(yearly_result)[:200])
        all_passed = False
    else:
        ok("tool:get_yearly_summary")

    # 6) get_all_time_summary
    all_time_result = run_tool(dispatcher, "get_all_time_summary", {})
    if all_time_result.get("status") != "success":
        fail("tool:get_all_time_summary", str(all_time_result)[:200])
        all_passed = False
    else:
        ok("tool:get_all_time_summary")

    # 7) delete_expense
    delete_result = run_tool(dispatcher, "delete_expense", {"expense_id": created_id})
    if delete_result.get("status") != "success":
        fail("tool:delete_expense", str(delete_result)[:200])
        all_passed = False
    else:
        ok("tool:delete_expense", f"id={created_id}")

    return all_passed


def main() -> int:
    if not TOKEN:
        print("ACCESS_TOKEN belum di-set.\nContoh:")
        print("  set ACCESS_TOKEN=eyJ...")
        return 1

    print("Starting AI integration test suite...")
    print(f"BASE_URL: {BASE_URL}")

    summary = []

    single_ok = test_single_chat(TOKEN)
    summary.append(("single_chat", single_ok))

    function_ok, history = test_chat_function_call_create(TOKEN)
    summary.append(("chat_function_call_create", function_ok))

    multi_ok = test_multi_turn(TOKEN, history)
    summary.append(("multi_turn", multi_ok))

    semantic_ok = test_semantic_search(TOKEN)
    summary.append(("semantic_search", semantic_ok))

    tools_ok = test_each_tool(TOKEN)
    summary.append(("each_tool", tools_ok))

    separator("SUMMARY")
    for name, passed in summary:
        print(f"{name:28s}: {'PASS' if passed else 'FAIL'}")

    all_green = all(passed for _, passed in summary)
    print("\nDONE" if all_green else "\nDONE WITH FAILURES")
    return 0 if all_green else 2


if __name__ == "__main__":
    raise SystemExit(main())
