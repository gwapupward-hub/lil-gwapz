#!/usr/bin/env python3
"""After extracting the Small Website Base ZIP into the repo, import the five original-PNG ZIP parts. No production writes or online actions."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, hashlib, sys

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'assets/halloween-2026/manifest.json'
EXPECTED=json.loads(MANIFEST.read_text(encoding='utf-8'))['stickers']
FILES={s['full'].lstrip('/'):s['master_sha256'] for s in EXPECTED}

if len(sys.argv)!=6:
    sys.exit('USAGE: python3 scripts/install_halloween_parts.py Part_1_of_5.zip Part_2_of_5.zip Part_3_of_5.zip Part_4_of_5.zip Part_5_of_5.zip')
seen=set()
for name in sys.argv[1:]:
    with ZipFile(name) as z:
        assert z.testzip() is None, f'Broken ZIP: {name}'
        for info in z.infolist():
            if info.is_dir() or info.filename=='PART_README.txt': continue
            rel=info.filename
            if rel not in FILES: sys.exit(f'Unexpected file path: {rel}')
            if rel in seen: sys.exit(f'Duplicate file: {rel}')
            # Reject link-like entries
            if ((info.external_attr >> 16)&0o170000)==0o120000:sys.exit('Symlink not allowed')
            data=z.read(info)
            if hashlib.sha256(data).hexdigest()!=FILES[rel]: sys.exit(f'Master hash mismatch: {rel}')
            dest=ROOT/rel
            dest.parent.mkdir(parents=True,exist_ok=True)
            if dest.exists():
                if dest.read_bytes()!=data:sys.exit(f'Conflicting existing file: {rel}')
            else:dest.write_bytes(data)
            seen.add(rel)
if seen != set(FILES):sys.exit(f'Incomplete set: {len(seen)}/{len(FILES)} masters imported')
output=ROOT/'downloads/Lil_Gwapz_Halloween_2026_Exclusive_HQ_20.zip'
output.parent.mkdir(exist_ok=True,parents=True)
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for rel in sorted(FILES):z.write(ROOT/rel,arcname=Path(rel).name)
    z.writestr('README.txt','Lil Gwapz Halloween 2026 - original 1254 x 1254 transparent PNG masters. Copyright © 2026 Tha GwapSpot. All rights reserved. Personal use only.')
print(f'PASS: {len(seen)} original PNGs installed. Exclusive download archive created at {output.relative_to(ROOT)}.')
