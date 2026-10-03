"""Smoke-test owned containers with synthetic config and no external network."""
import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent


def docker(*args):
    result = subprocess.run(['docker', *args], capture_output=True, text=True, encoding='utf-8', timeout=60)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return (result.stdout + result.stderr).strip() if args[0] == 'logs' else result.stdout.strip()


def probe(container, runtime, paths):
    if runtime == 'python':
        code = '''import json,urllib.request,urllib.error
results={}
for path in json.loads(__import__('sys').argv[1]):
 try:
  response=urllib.request.urlopen('http://127.0.0.1:8080'+path,timeout=15)
  results[path]=response.status
 except urllib.error.HTTPError as error:
  results[path]=error.code
print(json.dumps(results))'''
        command = ['python', '-c', code, json.dumps(paths)]
    else:
        code = '''(async()=>{const results={};for(const path of JSON.parse(process.argv[1])){
const response=await fetch('http://127.0.0.1:3000'+path,{redirect:'manual'});
results[path]=response.status;}console.log(JSON.stringify(results));})().catch(e=>{console.error(e.message);process.exit(1);});'''
        command = ['node', '-e', code, json.dumps(paths)]
    for attempt in range(20):
        try:
            return json.loads(docker('exec', container, *command))
        except RuntimeError:
            if docker('inspect', '--format', '{{.State.Running}}', container) == 'false':
                raise RuntimeError(docker('logs', container))
            if attempt == 19:
                raise
            time.sleep(0.5)


def main():
    owned = []
    report = {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'external_network': False}
    try:
        environment = {
            'SUPABASE_URL': 'https://audit.invalid', 'SUPABASE_ANON_KEY': 'synthetic-anon',
            'SUPABASE_SERVICE_ROLE_KEY': 'synthetic-service',
            'SUPABASE_JWT_SECRET': 'synthetic-container-secret-for-tests-only-123456',
            'OPENAI_API_KEY': 'synthetic-openai', 'TELEGRAM_BOT_TOKEN': '123456:synthetic-telegram',
            'TELEGRAM_WEBHOOK_URL': '', 'ENVIRONMENT': 'production',
            'ALLOWED_ORIGINS': '["https://audit.invalid"]', 'FRONTEND_URL': 'https://audit.invalid',
        }
        flags = [item for key, value in environment.items() for item in ('-e', f'{key}={value}')]
        backend = docker('run', '-d', '--network', 'none', '--label', 'life-os.verification=true', *flags, 'life-os-backend:verification')
        owned.append(backend)
        report['backend'] = probe(backend, 'python', ['/', '/docs', '/api/expenses', '/health'])
        assert report['backend'] == {'/': 200, '/docs': 404, '/api/expenses': 401, '/health': 503}
        report['python_version'] = docker('exec', backend, 'python', '--version')
        assert '3.11.' in report['python_version']
        docker('exec', backend, 'pip', 'check')
        docker('exec', backend, 'python', '-c', "from pathlib import Path; assert not Path('/app/.env').exists()")
        frontend = docker('run', '-d', '--network', 'none', '--label', 'life-os.verification=true', 'life-os-frontend:verification')
        owned.append(frontend)
        report['frontend'] = probe(frontend, 'node', ['/', '/login', '/dashboard'])
        assert report['frontend'] == {'/': 200, '/login': 200, '/dashboard': 307}
        report['node_version'] = docker('exec', frontend, 'node', '--version')
        assert report['node_version'].startswith('v24.')
        report['frontend_uid'] = docker('exec', frontend, 'id', '-u')
        assert report['frontend_uid'] == '1001'
        docker('exec', frontend, 'node', '-e', "if(require('fs').existsSync('/app/.env'))process.exit(1)")
        report['shutdown'] = {}
        for container, name in [(backend, 'backend'), (frontend, 'frontend')]:
            docker('stop', '--time', '15', container)
            state = json.loads(docker('inspect', '--format', '{{json .State}}', container))
            report['shutdown'][name] = {'exit_code': state['ExitCode'], 'oom_killed': state['OOMKilled']}
            assert state['ExitCode'] in (0, 143) and not state['OOMKilled']
            (OUTPUT / f'docker-{name}-runtime.log').write_text(docker('logs', container), encoding='utf-8')
        report['passed'] = True
    finally:
        for index, container in enumerate(owned):
            name = 'backend' if index == 0 else 'frontend'
            (OUTPUT / f'docker-{name}-runtime.log').write_text(docker('logs', container), encoding='utf-8')
            docker('rm', '-f', container)
        report['owned_containers_removed'] = len(owned)
        (OUTPUT / 'docker-runtime-verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
