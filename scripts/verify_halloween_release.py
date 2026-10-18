#!/usr/bin/env python3
"""Quality gate for Lil Gwapz Halloween 2026 static site assets."""
from pathlib import Path
from collections import Counter
import hashlib, json, sys, zipfile

root = Path(__file__).resolve().parents[1] if Path(__file__).parent.name == 'scripts' else Path(__file__).parent
manifest_path = root / 'assets/halloween-2026/manifest.json'
errors = []
def check(condition, message):
    if not condition: errors.append(message)

if not manifest_path.exists():
    sys.exit('BLOCKED: missing assets/halloween-2026/manifest.json. Upload the 2026 seasonal deployment kit before merging.')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
items = manifest.get('stickers', [])
check(len(items) == 20, 'expected exactly 20 seasonal stickers')
check(Counter(s.get('gender') for s in items) == {'male':10,'female':10}, 'expected 10 male + 10 female')
check(len({s.get('id') for s in items}) == 20, 'seasonal IDs must be unique')
for s in items:
    ident = s.get('id', '?')
    check(ident.startswith('LG-HW26-'), f'{ident}: invalid seasonal ID')
    for field in ('full','preview'):
        value = s.get(field, '')
        check(value.startswith('/assets/halloween-2026/'), f'{ident}: unsafe {field} path')
        path = root / value.lstrip('/')
        check(path.is_file(), f'{ident}: missing {field}: {path.relative_to(root)}')
    master = root / s.get('full','').lstrip('/')
    if master.is_file():
        check(hashlib.sha256(master.read_bytes()).hexdigest() == s.get('master_sha256'), f'{ident}: master sha256 mismatch')
    preview = root / s.get('preview','').lstrip('/')
    if preview.is_file():
        check(preview.stat().st_size < 300_000, f'{ident}: oversized website preview')
for name in ('halloween.html','halloween.css','halloween.js','og/lil-gwapz-halloween-2026.jpg'):
    check((root/name).is_file(), f'missing {name}')
for name in ('Lil_Gwapz_Halloween_2026_Telegram_20.zip','Lil_Gwapz_Halloween_2026_Exclusive_HQ_20.zip'):
    file = root / 'downloads' / name
    check(file.is_file(), f'missing downloads/{name}')
    if file.is_file():
        try:
            with zipfile.ZipFile(file) as z:
                check(z.testzip() is None, f'corrupted archive {name}')
        except zipfile.BadZipFile:
            errors.append(f'invalid ZIP: {name}')
if errors:
    print('HALLOWEEN RELEASE BLOCKED:')
    for e in errors: print(' -', e)
    sys.exit(1)
print('PASS: Halloween 2026 has 20 indexed stickers, 20 matched originals/previews, and 2 valid download packs.')
