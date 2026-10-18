#!/usr/bin/env python3
"""Block production release of Haunted Gwapz splash until its video and static states are complete."""
from pathlib import Path
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
VIDEO = ROOT / "assets/halloween-2026/splash/haunted-gwapz-2026-splash.mp4"
EXPECTED_SHA256 = "b83c5262338328a1247c3f1884cdccd7ddd54d5ea30cafefbb68a8546212f92d"
HOME = ROOT / "index.html"
CSS = ROOT / "css/halloween-splash.css"
JS = ROOT / "js/halloween-splash.js"
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)

check(HOME.exists(), "Missing homepage")
check(CSS.exists(), "Missing splash stylesheet")
check(JS.exists(), "Missing splash controller")
if VIDEO.exists():
    media = VIDEO.read_bytes()
    check(len(media) < 1_500_000, "Splash video exceeds 1.5 MB budget")
    check(media[4:8] == b"ftyp", "Splash video is not an MP4")
    check(hashlib.sha256(media).hexdigest() == EXPECTED_SHA256,
          "Optimized video SHA-256 mismatch: do not substitute other media")
else:
    errors.append("Optimized 10-second video missing. Upload Haunted_Gwapz_Splash_Video_Ready_For_GitHub.zip contents to assets/halloween-2026/splash/")
if HOME.exists() and CSS.exists() and JS.exists():
    html = HOME.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    for token in ('id="haunted-splash"', 'id="haunted-splash-video"',
                  'data-haunted-close', 'css/halloween-splash.css',
                  'js/halloween-splash.js', '/halloween.html', '/browse.html',
                  'https://t.me/addstickers/lil_gwapz_haunted2026_by_thalilgwapz_bot'):
        check(token in html, f"Homepage missing {token}")
    for token in ("[hidden]", ".haunted-splash__video", "prefers-reduced-motion", "safe-area-inset-bottom"):
        check(token in css, f"Splash stylesheet missing {token}")
    for token in ("sessionStorage", "Escape", "reducedMotion", "SETTINGS.videoSrc", "showStatic", "close()"):
        check(token in js, f"Splash JS missing {token}")
    video_path = "/assets/halloween-2026/splash/haunted-gwapz-2026-splash.mp4"
    check(video_path in js, "Splash JS points at the wrong video")
    for slug in ("LG-HW26-M08-werewolf-roar.webp", "LG-HW26-F10-witch-spellbook.webp"):
        check((ROOT / "assets/halloween-2026/previews" / slug).is_file(),
              f"Static fallback image missing: {slug}")
if errors:
    print("SPLASH RELEASE BLOCKED:")
    for issue in errors:
        print(" -", issue)
    sys.exit(1)
print("PASS: splash video checksum, static art, wiring, interaction hooks and lightweight media budget")
