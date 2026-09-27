"""Conservative tracked/untracked source scan; not a credential audit certificate."""
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
files = subprocess.check_output(['git', 'ls-files', '-co', '--exclude-standard', '-z'], cwd=root).decode().split('\0')
patterns = [r'AIza[0-9A-Za-z_-]{35}', r'gh[pousr]_[0-9A-Za-z]{30,}', r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', r'sk-[a-zA-Z0-9]{30,}']
findings = []
for name in sorted(set(filter(None, files))):
    path = root / name
    if not path.is_file() or path.suffix in ('.png', '.jpg'):
        continue
    text = path.read_text(errors='replace')
    if any(re.search(pattern, text) for pattern in patterns):
        findings.append(name)  # Never print matched values.
    if re.search(r'/home/[A-Za-z][\w.-]*/', text):
        findings.append(name + ':private-path')
print(json.dumps({'files_scanned': len(set(filter(None, files))), 'findings': findings}))
raise SystemExit(bool(findings))
