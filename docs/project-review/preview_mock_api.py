"""Local frontend QA only: synthetic data, no Supabase/OpenAI connections.

Run this on 127.0.0.1:8082, then start Next dev with
NEXT_PUBLIC_API_URL=http://127.0.0.1:8082 on a separate frontend port.
Open http://127.0.0.1:3003 (not localhost) to isolate mock cookies from localhost apps.
Never use this as the production API.
"""
import json
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

USER = {"id": "00000000-0000-4000-8000-000000000001", "email": "ui-test@example.invalid", "created_at": "2026-10-03T00:00:00Z"}
ROWS = {}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def respond(self, payload, status=200, cookies=()):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        for cookie in cookies:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode())

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/profile/me':
            self.respond({**USER, 'display_name': 'UI test (synthetic)', 'bio': None, 'avatar_url': None, 'telegram_linked': False, 'auth_provider': 'email', 'updated_at': USER['created_at']})
        elif path.startswith('/api/expenses/summary'):
            self.respond({'total_income': 0, 'total_expense': 0, 'net_balance': 0})
        elif path == '/api/expenses':
            self.respond({'expenses': list(ROWS.values()), 'total': len(ROWS)})
        elif path.startswith('/api/expenses/') and path.rsplit('/', 1)[1] in ROWS:
            self.respond(ROWS[path.rsplit('/', 1)[1]])
        else:
            self.respond({'detail': 'Mock endpoint not found'}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', '0'))) or b'{}')
        if path in ['/api/auth/login', '/api/auth/refresh']:
            self.respond({'access_token': 'synthetic-test-token', 'refresh_token': 'synthetic-refresh', 'expires_at': int(time.time()) + 3600, 'user': USER}, cookies=['access_token=synthetic; Path=/; HttpOnly; SameSite=Lax', 'refresh_token=synthetic; Path=/; HttpOnly; SameSite=Lax'])
        elif path == '/api/expenses':
            operation = self.headers.get('Idempotency-Key') or str(uuid.uuid4())
            ROWS.setdefault(operation, {**body, 'id': operation, 'created_at': USER['created_at'], 'updated_at': USER['created_at']})
            self.respond(ROWS[operation], 201)
        elif path == '/api/auth/logout':
            self.respond({'message': 'logged out'}, cookies=['access_token=; Max-Age=0; Path=/', 'refresh_token=; Max-Age=0; Path=/'])
        else:
            self.respond({'detail': 'Mock endpoint not found'}, 404)

if __name__ == '__main__':
    print('Synthetic QA API at http://127.0.0.1:8082', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8082), Handler).serve_forever()
