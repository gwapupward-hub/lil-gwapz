#!/usr/bin/env python3
"""Fail closed if the Halloween 2026 page or downloadable art is incomplete."""
from pathlib import Path
from collections import Counter
import hashlib, json, sys, zipfile

root = Path(__file__).resolve().parents[1]
file = root / "assets/halloween-2026/manifest.json"
if not file.exists():
    sys.exit("BLOCKED: missing seasonal manifest/assets. Import the full website kit.")
m = json.loads(file.read_text(encoding="utf-8"))
items = m.get("stickers", [])
errors = []
def check(ok, msg):
    if not ok: errors.append(msg)
check(len(items) == 20, "Expected 20 seasonal stickers")
check(Counter(s.get("gender") for s in items) == {"male": 10, "female": 10}, "Expected 10 male and 10 female")
check(len({s.get("id") for s in items}) == 20, "Seasonal IDs must be unique")
for s in items:
    ident = s.get("id", "?")
    check(ident.startswith("LG-HW26-"), f"Bad ID: {ident}")
    for key in ("full", "preview"):
        rel = s.get(key, "")
        check(rel.startswith("/assets/halloween-2026/"), f"{ident}: unsafe {key}")
        path = root / rel.lstrip("/")
        check(path.is_file(), f"{ident}: missing {key}: {rel}")
    path = root / s.get("full", "").lstrip("/")
    if path.is_file():
        check(hashlib.sha256(path.read_bytes()).hexdigest() == s.get("master_sha256"), f"{ident}: master hash mismatch")
for path in ("halloween.html", "halloween.css", "halloween.js", "og/lil-gwapz-halloween-2026.jpg"):
    check((root / path).is_file(), f"Missing {path}")
for file_name in ("Lil_Gwapz_Halloween_2026_Telegram_20.zip", "Lil_Gwapz_Halloween_2026_Exclusive_HQ_20.zip"):
    path = root / "downloads" / file_name
    check(path.is_file(), f"Missing downloads/{file_name}")
    if path.is_file():
        try:
            with zipfile.ZipFile(path) as z:
                check(z.testzip() is None, f"Corrupt download: {file_name}")
        except zipfile.BadZipFile:
            errors.append(f"Invalid ZIP: {file_name}")
if errors:
    print("HALLOWEEN RELEASE BLOCKED:")
    for issue in errors: print(" -", issue)
    sys.exit(1)
print("PASS: Halloween 2026 manifest, 20 stickers, 20 masters and previews, plus both archives")
