"""
Quick integration test for AI Chat & Semantic Search endpoints.
Run: python test_ai.py
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
TOKEN = (
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjZjYmRlOWUyLTUzOTMtNDBlOS05MTBhLWE4OGQwMDYzODUwYSIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJodHRwczovL2dxeWFvZnBkcHJhdHp5bmhod3F6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3OWRmMWY3YS02OTUyLTQxZDAtYTJlMi05OWVjZWVkZjNjZGUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc1MjMwODk0LCJpYXQiOjE3NzUyMjcyOTQsImVtYWlsIjoicG9qYW5lc2l5ZW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InBvamFuZXNpeWVuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6Ijc5ZGYxZjdhLTY5NTItNDFkMC1hMmUyLTk5ZWNlZWRmM2NkZSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc1MjI3Mjk0fV0sInNlc3Npb25faWQiOiI1N2U2NThjZS0yODA3LTQzZWMtOGNlYy03MTQxMWVmMTQ4NGIiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ"
    ".2OyJdQ10lwzA-hiR4IZasBc0xH7ayUW_UZOzE4gZHXTOsQLiACiuGXON_uLc6QB_E_x9wkWhcy-66_am6TR-WQ"
)
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

def separator(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def chat(message, history=None):
    """Send a chat message and return the response."""
    payload = {
        "message": message,
        "conversation_history": history or [],
    }
    resp = requests.post(f"{BASE_URL}/ai/chat", headers=HEADERS, json=payload)
    if resp.status_code != 200:
        print(f"  ❌ Status: {resp.status_code}")
        print(f"  Response: {resp.text[:500]}")
        return None
    data = resp.json()
    print(f"  📤 User: {message}")
    print(f"  🤖 AI:   {data['reply'][:300]}")
    if data.get("action_taken"):
        print(f"  🔧 Tools: {data['action_taken']}")
    return data


# ======================================================================
# TEST 1: Chat dengan Function Call — Buat Expense
# ======================================================================
separator("TEST 1: Function Call — Buat Expense")
print("  Mengirim pesan untuk membuat transaksi pengeluaran...\n")

result1 = chat("Catat pengeluaran 25000 untuk makan siang di warteg hari ini, kategori makanan")

if result1:
    print(f"\n  ✅ Test 1 selesai!")
    print(f"  History length: {len(result1['conversation_history'])}")
else:
    print(f"\n  ❌ Test 1 gagal!")

time.sleep(2)

# ======================================================================
# TEST 2: Multi-Turn Conversation — Lanjutkan dari Test 1
# ======================================================================
separator("TEST 2: Multi-Turn — Lanjut percakapan")
print("  Menggunakan conversation_history dari Test 1...\n")

if result1:
    history = result1["conversation_history"]

    # Turn 2: Tanya ringkasan
    result2 = chat("Berapa total pengeluaran saya bulan ini?", history)

    if result2:
        print(f"\n  ✅ Test 2a selesai! History length: {len(result2['conversation_history'])}")

        time.sleep(2)

        # Turn 3: Lanjutkan percakapan lagi
        history2 = result2["conversation_history"]
        result3 = chat("Sekarang catat juga pemasukan 500000 dari freelance, kategori pendapatan", history2)

        if result3:
            print(f"\n  ✅ Test 2b selesai! History length: {len(result3['conversation_history'])}")
        else:
            print(f"\n  ❌ Test 2b gagal!")
    else:
        print(f"\n  ❌ Test 2a gagal!")
else:
    print("  ⏭️ Skipped — Test 1 gagal")

time.sleep(2)

# ======================================================================
# TEST 3: Semantic Search
# ======================================================================
separator("TEST 3: Semantic Search")
print("  Mencari transaksi dengan query 'jajan di luar'...\n")

resp = requests.get(
    f"{BASE_URL}/ai/search",
    headers=HEADERS,
    params={"q": "jajan di luar", "threshold": 0.3, "limit": 5},
)

if resp.status_code == 200:
    data = resp.json()
    print(f"  🔍 Query: {data['query']}")
    print(f"  📊 Total results: {data['total']}")
    for i, item in enumerate(data["results"], 1):
        print(f"     {i}. Rp {item['amount']:,.0f} | {item['type']} | {item['category']} | "
              f"similarity: {item['similarity']:.3f}")
        if item.get("description"):
            print(f"        desc: {item['description']}")
    print(f"\n  ✅ Test 3 selesai!")
else:
    print(f"  ❌ Status: {resp.status_code}")
    print(f"  Response: {resp.text[:500]}")

# ======================================================================
# SUMMARY
# ======================================================================
separator("RINGKASAN TEST")
print("  Semua test selesai dijalankan.")
print("  Periksa output di atas untuk melihat hasilnya.\n")
